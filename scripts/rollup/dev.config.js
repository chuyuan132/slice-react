import reactDOMConfig from './reactDOM.config';
import reactConfig from './react.config';
import reactNoopRendererConfig from './reactNoopRenderer.config';

export default [...reactConfig, ...reactDOMConfig, ...reactNoopRendererConfig];
