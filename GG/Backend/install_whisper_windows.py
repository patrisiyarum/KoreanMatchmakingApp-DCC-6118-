import subprocess
import os
import sys

repo_url = "https://github.com/ggml-org/whisper.cpp.git"

print(f"Current working directory: {os.getcwd()}")
s = ""
while s.lower() not in ("y", "n"):
    s = input("Is the current working directory the GG/Backend folder? (y/n) ")

if s.lower() == "n":
    print("Please change the working directory to the correct folder. Exiting now.")
    sys.exit(1)

basedir = os.getcwd()
whisper_basedir = os.path.join(basedir, "whisper.cpp")
addon_path = os.path.join(whisper_basedir, "examples", "addon.node")
model_path = os.path.join(whisper_basedir, "models")
model_name = "medium"

if not os.path.exists(whisper_basedir):
    try:
        subprocess.run(["git", "clone", repo_url, whisper_basedir], check=True)
        print(f"Repository cloned successfully to: {whisper_basedir}")
    except subprocess.CalledProcessError as e:
        print(f"Error cloning repository: {e}")
        sys.exit(1)
    except FileNotFoundError:
        print("Git command not found. Ensure Git is installed and in your system's PATH.")
        sys.exit(1)
else:
    print(f"{whisper_basedir} already exists, skipping git clone.")

if os.path.isdir(addon_path):
    os.chdir(addon_path)
    print(f"Running npm install in {addon_path}")
    try:

        subprocess.run("npm install", check=True, shell=True)
    except subprocess.CalledProcessError as e:
        print(f"Error doing npm install: {e}")
        sys.exit(1)

    os.chdir(whisper_basedir)
    print(f"Running npx cmake-js compile -T addon.node -B Release in {whisper_basedir}")
    try:
        subprocess.run("npx cmake-js compile -T addon.node -B Release",
                       check=True, shell=True)
    except subprocess.CalledProcessError as e:
        print(f"Error doing npx cmake-js: {e}")
        sys.exit(1)
else:
    print(f"Addon path {addon_path} not found; skipping Node addon build.")

os.chdir(model_path)
print(f"Install model '{model_name}' from {model_path}")
try:
    subprocess.run(
    ["cmd", "/c", "download-ggml-model.cmd", model_name],
    check=True
)
except subprocess.CalledProcessError as e:
    print(f"Error on model install: {e}")
    sys.exit(1)