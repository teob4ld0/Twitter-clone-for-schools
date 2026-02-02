using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Google.Apis.Auth;
using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Serialization;
using MyNetApp.Data;
using MyNetApp.DTOs;
using MyNetApp.Models;
using MyNetApp.Services;

namespace MyNetApp.Controllers;

[ApiController]
[Route("/")]
public class AllgoodController : ControllerBase
{
    [HttpGet]
    public IActionResult AllGood()
    {
        return Ok(new { message = "All good!" });
    }
}