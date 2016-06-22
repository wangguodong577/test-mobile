angular.module('cgwy')
    .factory('HistoryDataCacheUtil', function ($ionicHistory,$timeout) {
	    var service = {};
		service.mapCache = {};

		service.putObj = function (key,obj){
			service.mapCache[key] = obj;
		}

		service.getObj = function (key){
			return service.mapCache[key];
		}


		service.delObj = function (key){
			var obj = service.mapCache[key];
			service.mapCache[key] = null;
			return obj;
		}

    return service;
});
