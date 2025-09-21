# Database management script for forex calculator development (PowerShell version)

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("start", "stop", "restart", "logs", "pgadmin", "reset", "status", "help")]
    [string]$Action
)

switch ($Action) {
    "start" {
        Write-Host "🚀 Starting PostgreSQL database..." -ForegroundColor Green
        docker-compose up -d postgres
        Write-Host "✅ Database started on localhost:5432" -ForegroundColor Green
        Write-Host "📊 Database: forex_calculator_db" -ForegroundColor Yellow
        Write-Host "👤 Admin User: postgres" -ForegroundColor Yellow
        Write-Host "👤 App User: forex_calculator_user" -ForegroundColor Yellow
        Write-Host "🔑 App Password: forex_calc_2024!" -ForegroundColor Yellow
    }
    
    "stop" {
        Write-Host "🛑 Stopping PostgreSQL database..." -ForegroundColor Yellow
        docker-compose down
        Write-Host "✅ Database stopped" -ForegroundColor Green
    }
    
    "restart" {
        Write-Host "🔄 Restarting PostgreSQL database..." -ForegroundColor Yellow
        docker-compose restart postgres
        Write-Host "✅ Database restarted" -ForegroundColor Green
    }
    
    "logs" {
        Write-Host "📋 Showing database logs..." -ForegroundColor Blue
        docker-compose logs -f postgres
    }
    
    "pgadmin" {
        Write-Host "🚀 Starting pgAdmin..." -ForegroundColor Green
        docker-compose up -d pgadmin
        Write-Host "✅ pgAdmin started on http://localhost:8080" -ForegroundColor Green
        Write-Host "📧 Email: admin@forex-calculator.local" -ForegroundColor Yellow
        Write-Host "🔑 Password: admin123" -ForegroundColor Yellow
        Write-Host "💡 Add connection: localhost:5432, forex_calculator_db" -ForegroundColor Cyan
    }
    
    "reset" {
        Write-Host "⚠️  Resetting database (this will delete all data)..." -ForegroundColor Red
        $confirm = Read-Host "Are you sure? (y/N)"
        if ($confirm -eq 'y' -or $confirm -eq 'Y') {
            docker-compose down -v
            docker volume prune -f
            docker-compose up -d postgres
            Write-Host "✅ Database reset complete" -ForegroundColor Green
        } else {
            Write-Host "❌ Reset cancelled" -ForegroundColor Red
        }
    }
    
    "status" {
        Write-Host "📊 Database status:" -ForegroundColor Blue
        docker-compose ps postgres
    }
    
    "help" {
        Write-Host "Forex Calculator Database Management" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Usage: .\scripts\db.ps1 -Action <command>" -ForegroundColor White
        Write-Host ""
        Write-Host "Commands:" -ForegroundColor Yellow
        Write-Host "  start    - Start PostgreSQL database" -ForegroundColor White
        Write-Host "  stop     - Stop all services" -ForegroundColor White
        Write-Host "  restart  - Restart PostgreSQL database" -ForegroundColor White
        Write-Host "  logs     - Show database logs" -ForegroundColor White
        Write-Host "  pgadmin  - Start pgAdmin web interface" -ForegroundColor White
        Write-Host "  reset    - Reset database (deletes all data)" -ForegroundColor White
        Write-Host "  status   - Show service status" -ForegroundColor White
        Write-Host ""
        Write-Host "Database Info:" -ForegroundColor Yellow
        Write-Host "  Database: forex_calculator_db" -ForegroundColor Gray
        Write-Host "  App User: forex_calculator_user" -ForegroundColor Gray
        Write-Host "  Schema: public (simple setup)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Examples:" -ForegroundColor Yellow
        Write-Host "  .\scripts\db.ps1 -Action start" -ForegroundColor Gray
        Write-Host "  .\scripts\db.ps1 -Action pgadmin" -ForegroundColor Gray
    }
}