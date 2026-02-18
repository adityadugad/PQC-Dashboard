from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from metrics import get_all_metrics
from database import init_db, get_history

# =========================================================
# APP INIT
# =========================================================
app = FastAPI(title="PQC Supremacy Dashboard")

# initialize database
init_db()

# mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# templates
templates = Jinja2Templates(directory="templates")


# =========================================================
# HOME PAGE → TABLE COMPARISON
# =========================================================
@app.get("/")
def home(request: Request):
    """
    First page → shows 8 metrics comparison table
    """
    data = get_all_metrics()

    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "data": data
        }
    )


# =========================================================
# INSIGHTS PAGE → GRAPH SLIDESHOW
# =========================================================
@app.get("/insights")
def insights(request: Request):
    """
    Graph visualization page
    """
    return templates.TemplateResponse(
        "insights.html",
        {"request": request}
    )


# =========================================================
# LIVE METRICS API (REAL TIME)
# =========================================================
@app.get("/metrics/live")
def live_metrics():
    """
    Returns fresh values every call.
    Used for real-time graphs.
    """
    return JSONResponse(get_all_metrics())


# =========================================================
# HISTORICAL DATA API
# =========================================================
@app.get("/metrics/history/{algorithm}")
def history_metrics(algorithm: str):
    """
    Returns stored historical data from SQLite.
    Example:
    /metrics/history/pqc
    /metrics/history/rsa
    /metrics/history/ecdh
    """
    data = get_history(algorithm.upper())
    return JSONResponse(data)


# =========================================================
# HEALTH CHECK (GOOD FOR RENDER)
# =========================================================
@app.get("/health")
def health():
    return {"status": "running"}
