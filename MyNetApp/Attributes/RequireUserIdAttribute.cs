using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;

namespace MyNetApp.Attributes;

/// <summary>
/// Attribute to restrict endpoint access to a specific user ID
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class RequireUserIdAttribute : Attribute, IAuthorizationFilter
{
    private readonly int _requiredUserId;

    public RequireUserIdAttribute(int requiredUserId)
    {
        _requiredUserId = requiredUserId;
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        // Get the user ID from the JWT claims
        var userIdClaim = context.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier);

        if (userIdClaim == null)
        {
            // User is not authenticated
            context.Result = new UnauthorizedResult();
            return;
        }

        if (!int.TryParse(userIdClaim.Value, out int userId))
        {
            // Invalid user ID format
            context.Result = new UnauthorizedResult();
            return;
        }

        if (userId != _requiredUserId)
        {
            // User ID doesn't match the required ID
            context.Result = new ForbidResult();
            return;
        }

        // User is authorized - allow the request to proceed
    }
}
