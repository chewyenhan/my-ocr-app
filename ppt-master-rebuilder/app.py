import os
import json
import tempfile
from flask import Flask, request, jsonify, send_file
# Since the modern recommended SDK is google-genai, we gracefully support both google-genai and google-generativeai imports
try:
    from google import genai
    from google.genai import types
    HAS_GENAI_SDK = True
except ImportError:
    try:
        import google.generativeai as l_genai
        HAS_GENAI_SDK = False
    except ImportError:
        HAS_GENAI_SDK = None

from rebuild_engine import PPTRebuildEngine, GlobalOffsets

app = Flask(__name__)

# Basic safety configurations for file upload streaming
app.config['MAX_CONTENT_LENGTH'] = 20 * 1024 * 1024  # 20MB Max size limit

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "service": "PPT-Master-Rebuilder Python Engine",
        "has_genai_sdk": HAS_GENAI_SDK is not None
    })

@app.route("/api/rebuild/analyze", methods=["POST"])
def analyze_and_rebuild():
    # 1. API Key Validation from custom X-API-Key header
    api_key = request.headers.get("X-API-Key") or os.environ.get("GEMINI_API_KEY")
    if not api_key or api_key == "MY_GEMINI_API_KEY":
        return jsonify({
            "error": "Missing valid API Key. Secure requests must supply 'X-API-Key' headers config in settings."
        }), 401

    # 2. Extract upload files or text styles config
    uploaded_file = request.files.get("file")
    style_guide = request.form.get("styleGuide", "Professional Business Clean Modern Theme")

    # 3. Retrieve and parse Global Calibration offsets
    try:
        offset_x = float(request.form.get("offsetX", 0.0))
        offset_y = float(request.form.get("offsetY", 0.0))
        scale_x = float(request.form.get("scaleX", 1.0))
        scale_y = float(request.form.get("scaleY", 1.0))
    except ValueError:
        return jsonify({"error": "Calibration offset parameters must be numeric floats."}), 400

    offsets = GlobalOffsets(offset_x, offset_y, scale_x, scale_y)

    # 4. Invoke Gemini API code block
    try:
        prompt_instructions = f"""You are a master PPT layout architect. Design/Analyze the slides layout structure.
Style guidance to follow: {style_guide}

Generate a clean presentation structure containing: Slide 1 (Corporate Introduction), Slide 2 (Feature list), Slide 3 (Analytics and figures).
You MUST output a valid, raw JSON array matching this exact schema layout without markdown blocks:
{{
  "slides": [
    {{
      "slideIndex": 1,
      "background": {{ "color": "F8FAFC", "theme": "light" }},
      "shapes": [
        {{ "type": "round-rect", "x": 10, "y": 30, "w": 80, "h": 50, "fill": "EFF6FF", "border": {{ "color": "3B82F6", "width": 1 }} }}
      ],
      "texts": [
        {{ "text": "EXECUTIVE BLUEPRINT SUMMARY", "fontSize": 24, "color": "1E3A8A", "bold": true, "italic": false, "alignment": "center", "x": 15, "y": 10, "w": 70, "h": 15 }}
      ]
    }}
  ]
}}
Only return the JSON response format. Ensure valid commas and strict bracket pairings. No extra texts."""

        extracted_json_str = ""

        if HAS_GENAI_SDK is True:
            # Modern official google-genai library call
            client = genai.Client(api_key=api_key)
            
            # If user uploaded a binary design document (PDF/PPTX), ingest page bases
            if uploaded_file:
                # Store temporarily to prevent filesystem leaks
                with tempfile.NamedTemporaryFile(delete=False) as temp:
                    uploaded_file.save(temp.name)
                    temp_path = temp.name

                with open(temp_path, "rb") as fFile:
                    pdf_data = fFile.read()
                
                os.unlink(temp_path)

                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=[
                        types.Part.from_bytes(
                            data=pdf_data,
                            mime_type=uploaded_file.mimetype or "application/pdf"
                        ),
                        prompt_instructions + "\nParse this slide and rebuild its layout coordinate grids."
                    ]
                )
            else:
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt_instructions
                )
            extracted_json_str = response.text
            
        elif HAS_GENAI_SDK is False:
            # Fallback for legacy google-generativeai API design
            l_genai.configure(api_key=api_key)
            model = l_genai.GenerativeModel('gemini-2.5-flash')
            
            if uploaded_file:
                # Base64 fallback block for direct document ingestion
                file_bytes = uploaded_file.read()
                file_chunk = {
                    "mime_type": uploaded_file.mimetype or "application/pdf",
                    "data": file_bytes
                }
                response = model.generate_content([file_chunk, prompt_instructions])
            else:
                response = model.generate_content(prompt_instructions)
            extracted_json_str = response.text
            
        else:
            # Simulated local engine fallback if no Google GenAI modules are present locally
            # Allows runnable offline testing for clients
            mock_data = {
                "slides": [
                    {
                        "slideIndex": 1,
                        "background": { "color": "F8FAFC", "theme": "light" },
                        "shapes": [
                            { "type": "round-rect", "x": 10, "y": 30, "w": 80, "h": 50, "fill": "EFF6FF", "border": { "color": "3B82F6", "width": 1 } },
                            { "type": "line", "x": 15, "y": 25, "w": 70, "h": 1, "fill": "94A3B8" }
                        ],
                        "texts": [
                            { "text": "EXECUTIVE RECONSTRUCTED SUMMARY", "fontSize": 24, "color": "1E3A8A", "bold": True, "italic": False, "alignment": "center", "x": 15, "y": 10, "w": 70, "h": 12 },
                            { "text": "Rebuild completed dynamically. This text block and the card shapes above are fully vector graphics natively editable inside Microsoft PowerPoint. Change colors, texts, and dimensions with full fidelity.", "fontSize": 14, "color": "475569", "bold": False, "italic": False, "alignment": "left", "x": 15, "y": 35, "w": 70, "h": 35 }
                        ]
                    }
                ]
            }
            extracted_json_str = json.dumps(mock_data)

        # 5. Filter Markdown formatting symbols out of AI string output
        clean_json_str = extracted_json_str.strip()
        if clean_json_str.startswith("```json"):
            clean_json_str = clean_json_str[7:]
        if clean_json_str.startswith("```"):
            clean_json_str = clean_json_str[3:]
        if clean_json_str.endswith("```"):
            clean_json_str = clean_json_str[:-3]
        clean_json_str = clean_json_str.strip()

        parsed_slides_payload = json.loads(clean_json_str)

        # 6. Rebuild PowerPoint slides using PPTRebuildEngine
        engine = PPTRebuildEngine(offsets)
        prs = engine.rebuild_presentation(parsed_slides_payload.get("slides", []))

        # Save presentation file safely into temporary file to return as download
        temp_ppt = tempfile.NamedTemporaryFile(suffix=".pptx", delete=False)
        prs.save(temp_ppt.name)
        temp_ppt_path = temp_ppt.name
        temp_ppt.close()

        return send_file(
            temp_ppt_path,
            as_attachment=True,
            download_name="PPT_Master_Rebuilt_Presentation.pptx",
            mimetype="application/vnd.openxmlformats-officedocument.presentationml.presentation"
        )

    except Exception as e:
        return jsonify({
            "error": "Failed during layout structural rebuild computation.",
            "details": str(e)
        }), 500

if __name__ == "__main__":
    # Runs on standard port 5000 in python standalone settings, 
    # bind to host 0.0.0.0 for container configuration compatibility
    app.run(host="0.0.0.0", port=5000, debug=True)
