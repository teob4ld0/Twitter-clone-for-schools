using System.Text.RegularExpressions;
using System.Net;
using Google;
using Google.Apis.Auth.OAuth2;
using Google.Cloud.Storage.V1;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;

namespace MyNetApp.Services;

public sealed class GoogleCloudStorageOptions
{
	public string BucketName { get; set; } = "";
	public string PublicBaseUrl { get; set; } = "";
	public string DefaultPrefix { get; set; } = "";

	/// <summary>
	/// Raw Google service account credentials JSON (string). Prefer supplying via environment variables / secrets.
	/// If not provided, Application Default Credentials (ADC) will be used.
	/// </summary>
	public string GoogleCredentialsJson { get; set; } = "";

	/// <summary>
	/// Base64-encoded Google service account credentials JSON.
	/// Useful for Docker/Kubernetes environments where raw JSON env vars are hard to quote.
	/// </summary>
	public string GoogleCredentialsJsonBase64 { get; set; } = "";

	/// <summary>
	/// Path to a credentials JSON file (e.g. a mounted secret). If provided, it will be read at startup.
	/// </summary>
	public string GoogleCredentialsFilePath { get; set; } = "";

	
	/// <summary>
	/// If true, tries to set object ACL to public-read. If your bucket uses Uniform Bucket-Level Access,
	/// this must be false and the bucket IAM/policy should make objects readable.
	/// </summary>
	public bool TrySetPublicReadAcl { get; set; } = false;
}

public sealed record MediaUploadResult(
	string Bucket,
	string ObjectName,
	string PublicUrl,
	string ContentType,
	long Size
);

public sealed class MediaStorageForbiddenException : Exception
{
	public string BucketName { get; }
	public string? ObjectName { get; }

	public MediaStorageForbiddenException(string message, string bucketName, string? objectName = null, Exception? innerException = null)
		: base(message, innerException)
	{
		BucketName = bucketName;
		ObjectName = objectName;
	}
}

public interface IMediaStorage
{
	Task<MediaUploadResult> UploadAsync(IFormFile file, string? prefix = null, CancellationToken ct = default);
	Task DeleteAsync(string objectName, CancellationToken ct = default);
	string GetPublicUrl(string objectName);
}

public sealed class GoogleCloudBuckets : IMediaStorage
{
	private static readonly Regex MultiSlash = new(@"/{2,}", RegexOptions.Compiled);
	private readonly StorageClient _storage;
	private readonly GoogleCloudStorageOptions _options;
	private readonly ILogger<GoogleCloudBuckets> _logger;

	public GoogleCloudBuckets(IOptions<GoogleCloudStorageOptions> options, ILogger<GoogleCloudBuckets> logger)
		: this(options, logger, storage: null)
	{
	}

	// For tests / DI override if desired.
	internal GoogleCloudBuckets(IOptions<GoogleCloudStorageOptions> options, ILogger<GoogleCloudBuckets> logger, StorageClient? storage)
	{
		_options = options.Value;
		_logger = logger;

		_storage = storage ?? CreateStorageClient(_options);

		if (string.IsNullOrWhiteSpace(_options.BucketName))
			throw new InvalidOperationException("GoogleCloudStorage:BucketName no está configurado.");

		if (string.IsNullOrWhiteSpace(_options.PublicBaseUrl))
			throw new InvalidOperationException("GoogleCloudStorage:PublicBaseUrl no está configurado.");
	}

	private static StorageClient CreateStorageClient(GoogleCloudStorageOptions options)
	{
		var credentialsJson = options.GoogleCredentialsJson?.Trim();
		if (string.IsNullOrWhiteSpace(credentialsJson) && !string.IsNullOrWhiteSpace(options.GoogleCredentialsJsonBase64))
		{
			try
			{
				var bytes = Convert.FromBase64String(options.GoogleCredentialsJsonBase64.Trim());
				credentialsJson = System.Text.Encoding.UTF8.GetString(bytes).Trim();
			}
			catch (Exception ex)
			{
				throw new InvalidOperationException(
					"GoogleCloudStorage:GoogleCredentialsJsonBase64 no es válido (base64 inválido o corrupto).",
					ex
				);
			}
		}

		if (string.IsNullOrWhiteSpace(credentialsJson) && !string.IsNullOrWhiteSpace(options.GoogleCredentialsFilePath))
		{
			try
			{
				credentialsJson = File.ReadAllText(options.GoogleCredentialsFilePath).Trim();
			}
			catch (Exception ex)
			{
				throw new InvalidOperationException(
					"GoogleCloudStorage:GoogleCredentialsFilePath no se pudo leer. Verificá el path y permisos del archivo.",
					ex
				);
			}
		}

		if (!string.IsNullOrWhiteSpace(credentialsJson))
		{
			try
			{
				var credential = GoogleCredential.FromJson(credentialsJson);
				if (credential.IsCreateScopedRequired)
				{
					credential = credential.CreateScoped("https://www.googleapis.com/auth/devstorage.read_write");
				}

				return StorageClient.Create(credential);
			}
			catch (Exception ex)
			{
				throw new InvalidOperationException(
					"GoogleCloudStorage: credenciales inválidas o no se pudo crear el cliente de Google Cloud Storage.",
					ex
				);
			}
		}

		// Fallback: Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS, metadata server, etc.)
		return StorageClient.Create();
	}

	public async Task<MediaUploadResult> UploadAsync(IFormFile file, string? prefix = null, CancellationToken ct = default)
	{
		if (file is null) throw new ArgumentNullException(nameof(file));
		if (file.Length <= 0) throw new ArgumentException("El archivo está vacío.", nameof(file));

		var contentType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType;
		var objectName = BuildObjectName(file.FileName, prefix);

		_logger.LogInformation("GoogleCloudBuckets: Iniciando upload - Bucket: {Bucket}, ObjectName: {ObjectName}, ContentType: {ContentType}, Tamaño: {Size} bytes", 
			_options.BucketName, objectName, contentType, file.Length);

		using var stream = file.OpenReadStream();

		var uploadOptions = new UploadObjectOptions();
		if (_options.TrySetPublicReadAcl)
		{
			uploadOptions.PredefinedAcl = PredefinedObjectAcl.PublicRead;
		}

		try
		{
			_logger.LogInformation("GoogleCloudBuckets: Llamando a UploadObjectAsync...");
			var startTime = DateTime.UtcNow;
			
			await _storage.UploadObjectAsync(
				bucket: _options.BucketName,
				objectName: objectName,
				contentType: contentType,
				source: stream,
				options: uploadOptions,
				cancellationToken: ct
			);
			
			var duration = DateTime.UtcNow - startTime;
			_logger.LogInformation("GoogleCloudBuckets: UploadObjectAsync completado en {Duration}ms", duration.TotalMilliseconds);
		}
		catch (GoogleApiException ex) when (ex.HttpStatusCode == HttpStatusCode.Forbidden)
		{
			_logger.LogError(ex, "GoogleCloudBuckets: Error 403 Forbidden al subir");
			throw new MediaStorageForbiddenException(
				"No tenés permisos para subir objetos al bucket (falta IAM: storage.objects.create).",
				bucketName: _options.BucketName,
				objectName: objectName,
				innerException: ex
			);
		}
		catch (GoogleApiException gex) when (_options.TrySetPublicReadAcl)
		{
			_logger.LogWarning(gex, "GoogleCloudBuckets: Error con ACL público, reintentando sin ACL...");
			// Common when Uniform Bucket-Level Access is enabled (ACLs disabled).
			stream.Position = 0;
			try
			{
				var startTime = DateTime.UtcNow;
				
				await _storage.UploadObjectAsync(
					bucket: _options.BucketName,
					objectName: objectName,
					contentType: contentType,
					source: stream,
					options: null,
					cancellationToken: ct
				);
				
				var duration = DateTime.UtcNow - startTime;
				_logger.LogInformation("GoogleCloudBuckets: Reintento sin ACL completado en {Duration}ms", duration.TotalMilliseconds);
			}
			catch (GoogleApiException ex) when (ex.HttpStatusCode == HttpStatusCode.Forbidden)
			{
				_logger.LogError(ex, "GoogleCloudBuckets: Error 403 Forbidden en reintento");
				throw new MediaStorageForbiddenException(
					"No tenés permisos para subir objetos al bucket (falta IAM: storage.objects.create).",
					bucketName: _options.BucketName,
					objectName: objectName,
					innerException: ex
				);
			}
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "GoogleCloudBuckets: Error inesperado al subir - Tipo: {ExceptionType}", ex.GetType().Name);
			throw;
		}

		_logger.LogInformation("GoogleCloudBuckets: Upload exitoso - URL: {Url}", GetPublicUrl(objectName));

		return new MediaUploadResult(
			Bucket: _options.BucketName,
			ObjectName: objectName,
			PublicUrl: GetPublicUrl(objectName),
			ContentType: contentType,
			Size: file.Length
		);
	}

	public async Task DeleteAsync(string objectName, CancellationToken ct = default)
	{
		if (string.IsNullOrWhiteSpace(objectName))
			throw new ArgumentException("objectName es requerido.", nameof(objectName));

		try
		{
			await _storage.DeleteObjectAsync(_options.BucketName, objectName, cancellationToken: ct);
		}
		catch (GoogleApiException ex) when (ex.HttpStatusCode == HttpStatusCode.Forbidden)
		{
			throw new MediaStorageForbiddenException(
				"No tenés permisos para borrar objetos del bucket (falta IAM: storage.objects.delete).",
				bucketName: _options.BucketName,
				objectName: objectName,
				innerException: ex
			);
		}
	}

	public string GetPublicUrl(string objectName)
	{
		if (string.IsNullOrWhiteSpace(objectName))
			throw new ArgumentException("objectName es requerido.", nameof(objectName));

		var baseUrl = _options.PublicBaseUrl.TrimEnd('/');
		var path = objectName.TrimStart('/');
		return $"{baseUrl}/{path}";
	}

	private string BuildObjectName(string originalFileName, string? prefix)
	{
		var ext = Path.GetExtension(originalFileName);
		if (string.IsNullOrWhiteSpace(ext) || ext.Length > 10)
		{
			ext = "";
		}

		var safePrefix = (string.IsNullOrWhiteSpace(prefix) ? _options.DefaultPrefix : prefix) ?? "";
		safePrefix = safePrefix.Trim().Replace('\\', '/').Trim('/');

		var datePrefix = $"{DateTime.UtcNow:yyyy/MM}";
		var filePart = $"{Guid.NewGuid():N}{ext.ToLowerInvariant()}";

		var combined = string.IsNullOrWhiteSpace(safePrefix)
			? $"{datePrefix}/{filePart}"
			: $"{safePrefix}/{datePrefix}/{filePart}";

		combined = MultiSlash.Replace(combined, "/");
		return combined;
	}
}
