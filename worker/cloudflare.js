import app from './index.js';
import {D1SaveBucket} from './d1-save-bucket.js';
// A public Worker cannot trust identity headers submitted by a visitor.
export default {fetch(request,env,ctx){const headers=new Headers(request.headers);headers.delete('oai-authenticated-user-id');headers.delete('oai-authenticated-user-email');return app.fetch(new Request(request,{headers}),{...env,BUCKET:new D1SaveBucket(env.DB)},ctx);}};
