import * as Immutable from 'immutable';
import { List, Map, Record } from 'immutable';

export default class dataController {
    private data;

    constructor(data?: Object) {
        this.data = Immutable.Map(data || {});
    }
}