# JSBuilder example

# project name (from the root folder)
# copyright = '(C) WebReflection JSBuilder from Falsy Values'
max_js = 'build/max.js'
min_js = 'build/min.js'

# file list (from the root/src folder)
files = [
    'intro.js',
    'keyboard.js',
    'display.js',
    'camera.js',
    'grid.js',
    'terrain.js',
    'castle.js',
    'game.js',
    'player.js',
    'main.js',
    'outro.js'
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
print("Build successful. :) {}".format(time.time()))