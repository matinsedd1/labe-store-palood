const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace(
  '<iframe src="https://my.spline.design/aicompanionrobot-qo7L2r4zZFOTW2oUdiyjISTi/" frameBorder="0" className="absolute inset-0 w-full h-[calc(100%+60px)] pointer-events-auto" style={{ border: \'none\' }}></iframe>',
  '{/* <iframe src="https://my.spline.design/aicompanionrobot-qo7L2r4zZFOTW2oUdiyjISTi/" frameBorder="0" className="absolute inset-0 w-full h-[calc(100%+60px)] pointer-events-auto" style={{ border: \'none\' }}></iframe> */}'
);

fs.writeFileSync('src/App.tsx', content);
