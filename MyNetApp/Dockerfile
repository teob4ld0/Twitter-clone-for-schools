# syntax=docker/dockerfile:1

# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Generate a dev HTTPS certificate (for local/dev containers).
# You can override this at runtime by mounting your own cert and setting the env vars.
RUN mkdir -p /https \
	&& dotnet dev-certs https -ep /https/aspnetapp.pfx -p "devcertpassword"

# Copy csproj and restore as distinct layers
COPY MyNetApp.csproj ./
RUN dotnet restore ./MyNetApp.csproj

# Copy everything else and publish
COPY . ./
RUN dotnet publish ./MyNetApp.csproj -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

EXPOSE 8080
EXPOSE 8081

COPY --from=build /https /https
COPY --from=build /app/publish ./
ENTRYPOINT ["dotnet", "MyNetApp.dll"]
