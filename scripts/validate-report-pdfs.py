"""Independent inspection of R7 layout fixtures. Requires pypdf/pdfplumber.

Usage: python3 scripts/validate-report-pdfs.py /tmp/brix-r7-render-evidence
This is layout evidence, not canonical reconciliation or staging certification.
"""
import hashlib
import json
from pathlib import Path
import sys

import pdfplumber
from pypdf import PdfReader


def main(directory: Path):
    metrics = json.loads((directory / "metrics.json").read_text())
    results = {}
    for name, expected in metrics.items():
        path = directory / f"{name}.pdf"
        data = path.read_bytes()
        assert hashlib.sha256(data).hexdigest() == expected["fileHash"], (name, "file hash")
        assert len(data) == expected["sizeBytes"], (name, "file size")
        reader = PdfReader(path)
        assert len(reader.pages) == expected["pageCount"], (name, "page count")
        assert reader.metadata.title and reader.trailer["/Root"]["/Lang"] == "en-US", (name, "metadata")
        texts = [page.extract_text() for page in reader.pages]
        all_text = "\n".join(texts)
        assert not any(token in all_text for token in ["undefined", "{{", "}}", "TODO", "```"]), (name, "leakage")
        assert all(text.strip() for text in texts), (name, "empty page")
        for index, text in enumerate(texts):
            assert "BRIX REAL ESTATE | PRIVATE REPORT" in text, (name, index, "header")
            assert f"{index + 1} / {len(texts)}" in text, (name, index, "page number")
        with pdfplumber.open(path) as document:
            for index, page in enumerate(document.pages):
                assert page.width == 612 and page.height == 792, (name, "page size")
                for char in page.chars:
                    assert char["x0"] >= 0 and char["x1"] <= 612.1, (name, index, "horizontal clipping")
                    assert char["top"] >= 0 and char["bottom"] <= 792.1, (name, index, "vertical clipping")
        if name == "long-table":
            for index in range(80):
                assert all_text.count(f"ROW-{index:03d}") == 1, (name, index, "lost/duplicate row")
            for text in texts:
                if "ROW-" in text:
                    assert "Source-linked finding" in text and "Status" in text, (name, "repeated header")
        if name == "summary":
            front = "\n".join(texts[:2])
            assert "Proceed with Conditions" in front and "Quick Review" in front, (name, "front matter")
        results[name] = {"pages": len(texts), "bytes": len(data), "validation": "PASS"}
    (directory / "pdf-validation.json").write_text(json.dumps(results, indent=2) + "\n")
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main(Path(sys.argv[1]))
