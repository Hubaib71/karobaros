from fastapi import FastAPI

app = FastAPI(
    title="KarobarOS API",
    description="AI-powered operating system for small businesses",
    version="0.1.0",
)


@app.get("/")
def root():
    return {
        "success": True,
        "message": "KarobarOS API is running",
        "version": "0.1.0",
    }


@app.get("/api/health")
def health_check():
    return {
        "success": True,
        "status": "healthy",
    }