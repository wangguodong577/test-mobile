angular.module('cgwy')
    .controller('ReturnCtrl', function ($scope, $ionicPopup, ProfileService,AlertService) {

        $scope.form = {
            productNum: '',
            productName: '',
            telephone: '',
            restaurantName: '',
            reason: ''

        };
        $scope.submitServe = function(form) {
            console.log(form);

            if(form.productNum === "") {
                AlertService.alertMsg("请填写商品订单");
                return;
            }

            if(form.productName === "") {
                AlertService.alertMsg("请填写商品名称");
                return;
            }
            if(form.telephone === "") {
                AlertService.alertMsg("请填写练习人号码");
                return;
            }

            if(form.restaurantName === "") {
                AlertService.alertMsg("请填写餐馆名称");
                return;
            }
            if(form.reason === "") {
                AlertService.alertMsg("请填写退换货理由");
                return;
            }
        }
    });