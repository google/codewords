#!/usr/bin/python


# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
A script to build `codewords_core.js and codewords_lang_js.js libraries.

Built libraries will be located in codewords_core/build/ and
codewords_lang_js/build/, respectively.

To run:

    ./build_js.py

To run in continuous watch mode:

    ./build_js.py --watch
"""

from __future__ import print_function
import argparse
import subprocess
import sys
import time


def _init_args():
    """ Parse the script arguments using argparse. """
    parser = argparse.ArgumentParser()
    parser.add_argument('--watch',
        action='store_true',
        help='Execute subproject compilers in watch mode. Exit when any complete.')

    # TODO: --inlineSourceMap to improve test debugging.

    return parser.parse_args()

def _compile_typescript(sublibrary, *optional_args):
    args = ['npx', 'tsc']
    for x in optional_args:
        args.append(str(x))
    return subprocess.Popen(args, cwd=sublibrary, stdout=sys.stdout, stderr=sys.stderr)

def main():
    args = _init_args()

    # TODO: Check for node_module/. If missing, npm install.

    if args.watch:
        p1 = _compile_typescript('codewords_core', '--watch')
        p2 = _compile_typescript('codewords_lang_js', '--watch')
        while p1.poll() is None:
            if p2.poll() is not None:
                sys.exit(p2.returncode)
            time.sleep(1)  # 1 second
        sys.exit(p1.returncode)

    else:
        p1 = _compile_typescript('codewords_core')
        result1 = p1.wait()
        if result1 != 0:
            system.exit(1)
        p2 = _compile_typescript('codewords_lang_js')
        result2 = p2.wait()
        if result2 != 0:
            system.exit(1)
        print('Success!')

if __name__ == '__main__':
    main()