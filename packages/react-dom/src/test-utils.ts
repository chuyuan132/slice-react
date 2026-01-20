import { ReactElementType } from 'shared/ReactTypes';
import reactDOM from 'react-dom';

export function renderIntoDocument(element: ReactElementType) {
  const div = document.createElement('div');
  reactDOM.createRoot(div).render(element);
}
