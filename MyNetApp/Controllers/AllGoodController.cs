using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyNetApp.Data;
using MyNetApp.DTOs;
using MyNetApp.Models;
using System.Security.Claims;

namespace MyNetApp.Controllers;

[ApiController]
[Route("allgood")]

public class AllGoodController : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public IActionResult Get()
    {
        return Ok("allgood");
    }
}