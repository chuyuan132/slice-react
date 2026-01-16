import reactDOM from '../../packages/react-dom';

function App() {
  return (
    <div>
      <span>hello world</span>
    </div>
  );
}

reactDOM.createRoot(document.getElementById('root') as Element).render(App as any);


