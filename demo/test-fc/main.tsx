import reactDOM from '../../packages/react-dom';

const jsx = (
  <div>
    <span>hello world</span>
  </div>
);
reactDOM.createRoot(document.getElementById('root') as Element).render(jsx as any);


