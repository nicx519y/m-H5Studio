declare var createjs: any;

export default class Event {
    private static eventList:any = new Array();
    
    /*
	 * 添加事件监听
	*/
	public static addEventHandler(eventName:string, callback:Function) {
        if(!this.eventList[eventName]) {
            this.eventList[eventName] = new Array();
        }
		
        this.eventList[eventName].push(callback);
	}

	/*
	 * 移除事件监听
	*/
	public static removeEventHandler(eventName:string) {
		delete this.eventList[eventName];
	}

	/*
	 * 事件触发器
	*/
	public static triggerHandler(eventName:string, returnData:Object) {
		let callbackList = this.eventList[eventName];
        callbackList.map((fun, index) => {
            fun(returnData);
        });
	}
}