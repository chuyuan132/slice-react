import reactDOM from '../../packages/react-dom';
import { useState, useEffect } from 'react';

function Test() {


  useEffect(() => {
    console.log('father');
  }, []);

  return (
    <div >
      <Child />
    </div>

  );
}


function Child() {
  useEffect(() => {
    console.log('children');
  }, []);

  return (
    <div>
      child
    </div>

  );
}
reactDOM.createRoot(document.getElementById('root') as Element).render(<Test /> as any);


