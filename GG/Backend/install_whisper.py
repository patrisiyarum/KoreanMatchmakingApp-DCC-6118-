import subprocess
import os
import sys

repo_url = "https://github.com/ggml-org/whisper.cpp.git"

print(f"Current working directory: {os.getcwd()}")
s = ""
while s.lower() != "y" and s.lower() != "n":
    s = input("Is the current working directory the GG/Backend folder? (y/n)")

if s.lower() == "n":
    print("Please change the working directory to the correct folder. Exiting now.")
    sys.exit(1)

basedir = os.getcwd()
whisper_basedir = os.path.join(basedir, "whisper.cpp")
addon_path = os.path.join(whisper_basedir, "examples", "addon.node")
model_path = os.path.join(whisper_basedir, "models")
# model_name = "base.en"
model_name = "medium"

try:
    subprocess.run(["git", "clone", repo_url, whisper_basedir], check=True, shell=False)
    print(f"Repository cloned successfully to: {whisper_basedir}")
except subprocess.CalledProcessError as e:
    print(f"Error cloning repository: {e}")
    sys.exit(1)
except FileNotFoundError:
    print("Git command not found. Ensure Git is installed and in your system's PATH.")
    sys.exit(1)

os.chdir(addon_path)
print(f"Running npm install in {addon_path}")
try:
    subprocess.run(["npm", "install"], check=True, shell=False)
except subprocess.CalledProcessError as e:
    print(f"Error doing npm install: {e}")
    sys.exit(1)

os.chdir(whisper_basedir)
print(f"Running npx cmake-js compile -T addon.node -B Release in {whisper_basedir}")
try:
    subprocess.run(["npx", "cmake-js", "compile", "-T", "addon.node", "-B", "Release"], check=True, shell=False)
except subprocess.CalledProcessError as e:
    print(f"Error doing npx cmake-js: {e}")
    sys.exit(1)

os.chdir(model_path)
print(f"Install model from {model_path}")
try:
    model_script = "./download-ggml-model.sh"
    # Use bash explicitly so this works even if execute bit is missing.
    command = ["bash", model_script, model_name]

    if not os.path.exists(os.path.join(model_path, model_script.lstrip("./"))):
        print(f"Model download script not found: {model_script} in {model_path}")
        sys.exit(1)

    subprocess.run(command, check=True, shell=False)
except subprocess.CalledProcessError as e:
    print(f"Error on model install: {e}")
    sys.exit(1)
except FileNotFoundError as e:
    print(f"Error on model install: {e}")
    sys.exit(1)