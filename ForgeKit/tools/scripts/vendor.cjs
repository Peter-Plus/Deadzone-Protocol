// Developer-only: prepackage the local dependency as a classic script for file://.
const esbuild=require('esbuild');
const path=require('node:path');
esbuild.buildSync({stdin:{contents:"import * as THREE from 'three'; import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'; export {THREE,GLTFLoader};",resolveDir:path.resolve(__dirname,'../..')},bundle:true,format:'iife',globalName:'ForgeVendor',outfile:path.resolve(__dirname,'../../previewer/vendor/three-gltf.js'),minify:true,legalComments:'eof'});
