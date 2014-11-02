# JSBuilder example

# project name (from the root folder)
# copyright = '(C) WebReflection JSBuilder from Falsy Values'
max_js = 'build/max.js'
min_js = 'build/min.js'

# file list (from the root/src folder)
files = [
    '01_intro.js',
    '02_utils.js',
    '03_shaders.js',
    '04_materials.js',
    '05_userinput.js',
    '06_display.js',
    '07_camera.js',
    '08_grid.js',
    '09_pathfinding.js',
    '10_overlays.js',
    '11_world.js',
    '12_player.js',
    '13_main.js',
    '14_outro.js'
]

# execute the task
import JSBuilder
JSBuilder.compile(
    copyright,
    max_js,
    min_js,
    files
)

import time
print("Build successful. :) " + str(time.time()))