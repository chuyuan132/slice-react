import react from 'react';
import reactDOM from 'react-dom';

const jsx = (
  <div>
    <span>hello react</span>
  </div>
);
console.log(react);
console.log(reactDOM);

const root = reactDOM.createRoot(document.getElementById('root'));
root.render(jsx);
