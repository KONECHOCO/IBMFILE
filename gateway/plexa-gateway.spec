# PyInstaller build of the gateway for the Windows desktop app (see desktop/build.ps1).
from PyInstaller.utils.hooks import collect_all, collect_submodules

datas, binaries, hiddenimports = [], [], []
# Database drivers are imported lazily, so PyInstaller cannot find them on its own.
for pkg in ["uvicorn", "psycopg", "psycopg_binary", "oracledb", "pytds", "pymysql", "jpype", "jaydebeapi"]:
    d, b, h = collect_all(pkg)
    datas += d
    binaries += b
    hiddenimports += h
hiddenimports += collect_submodules("plexa_gateway")

a = Analysis(["run.py"], pathex=["."], binaries=binaries, datas=datas, hiddenimports=hiddenimports,
             excludes=["pytest", "tkinter", "matplotlib", "numpy"])
pyz = PYZ(a.pure)
exe = EXE(pyz, a.scripts, [], exclude_binaries=True, name="plexa-gateway", console=False, upx=False)
coll = COLLECT(exe, a.binaries, a.datas, name="plexa-gateway", upx=False)
