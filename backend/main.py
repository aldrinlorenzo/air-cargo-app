from fastapi import FastAPI, Request, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from conversion.services.xml_service import parse_xml
from conversion.services.jsonld_service import to_json_ld
from utils.file_utils import build_filename
from ai.models.request import RequestData
from ai.services.ai_service import run_ai

import time
import json
import io


app = FastAPI(title="Air Cargo Dashboard API")

# Setup CORS for the Angular frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Air Cargo API is running"}

@app.get("/api/dashboard/stats")
def get_dashboard_stats():
    return {
        "activeDgrShipments": 42,
        "flaggedDgrShipments": 3,
        "uldUtilization": 91.4,
        "uldActive": 1204,
        "uldInTransit": 82,
        "cargoIqMilestoneCompletion": 98,
        "weather": {
            "hub": "FRA HUB (FRANKFURT)",
            "condition": "Clear Sky",
            "visibility": "10,000+ m",
            "windSpeed": "12 kts NE",
            "activeRunways": "07R, 25C"
        }
    }

@app.get("/api/awb/{awb_number}/compliance")
def get_awb_compliance(awb_number: str):
    return {
        "awb_number": awb_number,
        "consignment": "High-Density Energy Solutions (Lithium-Ion Component)",
        "alerts": [
            {
                "type": "CRITICAL",
                "title": "UN3480 Requirement",
                "message": "Packaging exceeds the 30% State of Charge (SoC) limit for passenger aircraft. Must be re-routed via Cargo-Only flight (CAO)."
            },
            {
                "type": "INFO",
                "title": "Packing Instruction 965",
                "message": "Section IA compliance detected. Overpack markings required in accordance with IATA DGR Figure 7.1.A."
            }
        ],
        "checks": [
            {
                "description": "Lithium ion batteries (UN 3480, PI 965)",
                "classDiv": "Class 9",
                "packaging": "Fibreboard Box",
                "status": "FAIL"
            },
            {
                "description": "Hazard Labeling (Class 9 & CAO)",
                "classDiv": "-",
                "packaging": "Standard",
                "status": "PASS"
            },
            {
                "description": "Shipper's Declaration (Digital DGD Form)",
                "classDiv": "-",
                "packaging": "NOTOC Required",
                "status": "PASS"
            }
        ],
        "ai_analysis": "Hello Loadmaster Thorne. I've analyzed AWB " + awb_number + ". I found a **Critical Conflict** with IATA Section 5, Sub-section 5.0.2.7."
    }

@app.get("/api/uld/status")
def get_uld_status():
    return [
        {
            "id": "AKE 82910 LH",
            "status": "STAGED",
            "gate": "Gate B14",
            "health": 98,
            "temp": "+4.2°C",
            "milestones": ["RCL", "MAN", "DEP"]
        },
        {
            "id": "PMC 44021 AF",
            "status": "LOADED",
            "gate": "Flight AF006",
            "health": 72,
            "warning": "High G-Force Warning",
            "milestones": ["RCL", "MAN", "DEP"]
        }
    ]

# File upload > JSON-LD response
@app.post("/convert")
async def convert(file: UploadFile = File(...)):
    if not file.filename.endswith(".xml"):
        raise HTTPException(status_code=400, detail="Only XML files allowed")

    try:
        xml_bytes = await file.read()

        parsed = parse_xml(xml_bytes)
        json_ld = to_json_ld(parsed)

        return JSONResponse(content=json_ld)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# File upload > Download JSON-LD file
@app.post("/convert/download")
async def convert_download(file: UploadFile = File(...)):
    if not file.filename.endswith(".xml"):
        raise HTTPException(status_code=400, detail="Only XML files allowed")

    try:
        xml_bytes = await file.read()

        parsed = parse_xml(xml_bytes)
        json_ld = to_json_ld(parsed)

        json_str = json.dumps(json_ld, indent=2, ensure_ascii=False)

        output_filename = build_filename(file.filename)

        return StreamingResponse(
            io.BytesIO(json_str.encode("utf-8")),
            media_type="application/ld+json",
            headers={
                "Content-Disposition": f'attachment; filename="{output_filename}"'
            }
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Raw XML > JSON-LD response
@app.post("/convert/raw")
async def convert_raw(request: Request):
    xml_bytes = await request.body()

    if not xml_bytes:
        return JSONResponse(
            status_code=400,
            content={"error": "Empty XML body"}
        )

    parsed = parse_xml(xml_bytes)
    json_ld = to_json_ld(parsed)

    return JSONResponse(content=json_ld)

# Raw XML > Download JSON-LD file
@app.post("/convert/raw/download")
async def convert_raw_download(request: Request):
    xml_bytes = await request.body()

    if not xml_bytes:
        return JSONResponse(
            status_code=400,
            content={"error": "Empty XML body"}
        )

    parsed = parse_xml(xml_bytes)
    json_ld = to_json_ld(parsed)

    json_str = json.dumps(json_ld, indent=2, ensure_ascii=False)

    original_filename = request.headers.get("x-filename", "input.xml")
    output_filename = build_filename(original_filename)

    return StreamingResponse(
        io.BytesIO(json_str.encode("utf-8")),
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="{output_filename}"'
        }
    )

@app.post("/ai")
def ai_endpoint(data: RequestData):
    result = run_ai(data.text)
    return {"result": result}