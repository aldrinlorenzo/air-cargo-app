from datetime import datetime
import re


def build_filename(original: str) -> str:
    if not original:
        original = "input"

    base = original.rsplit(".", 1)[0]
    base = re.sub(r"[^a-zA-Z0-9_-]", "_", base)

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")

    return f"{ts}_{base}.jsonld"