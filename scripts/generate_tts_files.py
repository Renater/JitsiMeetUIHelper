"""
Generate TTS files for an offline usage.

Prerequisites:
    Install following pip modules:

     pip install gTTS-token --upgrade
     pip install gTTS --upgrade
     pip install pydub
"""

import os, json, sys, getopt
from os import walk
from gtts import gTTS
from pathlib import Path
from pydub import AudioSegment


# InputFolder where json lang translation files are
inputFolder = "./lang/"

# OutputFolder where generated mp3 files wile be used
outputFolder = "./gen/"

# Output format
format = "mp3"

# Audio frame rate
frameRate = 27000

# Generic function to generate TTS mp3 files
def generateTTS(key, value, lang):
    Path(outputFolder+lang).mkdir(parents=True, exist_ok=True)
    outputFile = outputFolder+lang+"/"+key+"."+format
    print("[Lang:",lang,"] Generating file", outputFile)
    gt = gTTS(text=value, lang=lang, slow=False)
    gt.save(outputFile)
    audioEncode(outputFile, format)

# encode in asked audio file format
def audioEncode(file, audioFormat):
    sound = AudioSegment.from_mp3(file)
    sound.frame_rate = int(frameRate)
    sound.export(file, format=audioFormat)


# Get command line arguments
try:
    opts, args = getopt.getopt(sys.argv[1:],"hi:o:f:",["input-folder=","output-folder=", "format=", "frame-rate="])

except getopt.GetoptError:
    print('generate_tts_files.py [-i/--input-folder <input_folder>] [-o/--output-folder <output_folder>] [-f/-format <format>] [--frame-rate <frame_rate]')
    sys.exit(2)

for opt, arg in opts:
    if opt == '-h':
        print('Usage:')
        print('generate_tts_files.py [-i/--input-folder <input_folder>] [-o/--output-folder <output_folder>] [-f/-format <format>] [--frame-rate <frame_rate>]')
        print('\t-i/--input-folder <input_folder>: input folder where translation json files are')
        print('\t-o/--output-folder <output_folder>: folder where files will be generated')
        print('\t-f/--format <format>: audio file format')
        print('\t--frame-rate <frame_rate>: audio frame rate. Default is 26000')
        sys.exit()
    elif opt in ("-i", "--input-folder"):
        inputFolder = arg
    elif opt in ("-o", "--output-folder"):
        outputFolder = arg
    elif opt in ("-f", "--format"):
        format = arg
    elif opt == "--frame-rate":
        frameRate = arg


print('[Info] Input folder: ' + inputFolder)
print('[Info] Output folder: ' + outputFolder)
print('[Info] Audio format: ' + format)
print('[Info] Audio frame rate: ' + str(frameRate))

# Check if input folder exists
if not os.path.isdir(inputFolder):
    print("[Error] input folder (\""+inputFolder+"\"] not found, exiting.")
    sys.exit(2)

# Check if output folder exists
if not os.path.isdir(outputFolder):
    print("[Error] output folder (\""+outputFolder+"\") not found, exiting.")
    sys.exit(2)


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