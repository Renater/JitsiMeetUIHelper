"""
Generate TTS files for an offline usage

Prerequisites:
    Install following pip modules:

     pip3 install gTTS-token --upgrade
     pip3 install gTTS --upgrade
"""

import os, json, sys, getopt
from os import walk
from gtts import gTTS
from pathlib import Path

# InputFolder where json lang translation files are
inputFolder = "./lang/"

# OutputFolder where generated mp3 files wile be used
outputFolder = "./gen/"


# Generic function to generate TTS mp3 files
def generateTTS(key, value, lang):
    Path(outputFolder+lang).mkdir(parents=True, exist_ok=True)
    outputFile = outputFolder+lang+"/"+key+".mp3"
    print("[Lang:",lang,"] Generating file", outputFile)
    gt = gTTS(text=value, lang=lang, slow=False)
    gt.save(outputFile)

# Get command line arguments
try:
    opts, args = getopt.getopt(sys.argv[1:],"hi:o:",["input-folder=","output-folder="])

except getopt.GetoptError:
    print('generate_tts_files.py [-i/--input-folder <input_folder>] [-o/--output-folder <output_folder>]')
    sys.exit(2)

for opt, arg in opts:
    if opt == '-h':
        print('generate_tts_files.py [-i/--input-folder <input_folder>] [-o/--output-folder <output_folder>]')
        sys.exit()
    elif opt in ("-i", "--input-folder"):
        inputFolder = arg
    elif opt in ("-o", "--output-folder"):
        outputFolder = arg


print('[Info] InputFolder: ' + inputFolder)
print('[Info] OutputFolder: ' + outputFolder)

# Check if input and output folder exists
if not os.path.isdir(inputFolder):
    print("[Error] input folder (\""+inputFolder+"\"] not found, exiting.")
    sys.exit()

if not os.path.isdir(outputFolder):
    print("[Error] output folder (\""+outputFolder+"\") not found, exiting.")
    sys.exit()



f = []
for (dirpath, dirnames, filenames) in walk(inputFolder):
    f.extend(filenames)
    break

for file in f:
    ext = os.path.splitext(file)
    if ext[1] == ".json":
        lang = ext[0]
        currentFile = open(inputFolder + file)
        data = json.load(currentFile)
        for key, value in data[ext[0]].items():
            generateTTS(key, value, lang)
        currentFile.close()