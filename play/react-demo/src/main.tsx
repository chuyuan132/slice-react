import react from 'react';
import reactDOM from 'react-dom';
console.log(react);
console.log(reactDOM);
const jsx = (
  <div>
    <span>hello world</span>
  </div>
)
reactDOM.createRoot(document.getElementById('root')).render(jsx)


