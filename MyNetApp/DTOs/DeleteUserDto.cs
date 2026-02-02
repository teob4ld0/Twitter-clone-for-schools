namespace MyNetApp.DTOs
{
    public class DeleteUserDto
    {
        public int userId { get; set; }
    }
}

//Verifica si es necesario este DTO, ya que en el controller solo se pasa la id por la URL, en todo caso hazlo útil.