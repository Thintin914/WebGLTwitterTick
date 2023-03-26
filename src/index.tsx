import React from 'react';
import ReactDOM from 'react-dom/client';
import {GLPainter} from './GLPainter';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <canvas id='webgl-canvas' width={window.innerWidth} height={1} tabIndex={1}></canvas>
    <GLPainter/>
  </React.StrictMode>
);
