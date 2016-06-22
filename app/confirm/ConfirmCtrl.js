angular.module('cgwy')
    .controller('ConfirmCtrl', function ($scope, $state, $stateParams, $rootScope, $filter, $ionicPopup, $location, ProfileService, DeviceUtil, CartService, OrderService, Analytics, AlertService) {
        ProfileService.getProfile().then(function (profile) {
            $scope.profile = profile;
        });

        ProfileService.getRestaurants().then(function (data) {
            $scope.myRestaurant = data[0];
        });

        $scope.currentUrl = $location.url();

        $scope.chosenItem = [];
        $scope.previewOrder = function () {
            var array = [];
            $scope.chosenItem = CartService.getChosenItem();
            $scope.chosenItem.forEach(function (orderItem) {
                if (orderItem.spikeItem) {
                    array.push({
                        skuId: orderItem.sku.id,
                        quantity: orderItem.quantity,
                        bundle: orderItem.bundle,
                        spikeItemId: orderItem.spikeItem.id,
                        cartSkuType: 2
                    })
                } else {
                    array.push({
                        skuId: orderItem.sku.id,
                        quantity: orderItem.quantity,
                        bundle: orderItem.bundle
                    })
                }

            })

            OrderService.previewOrder(array).then(function (orders) {
                $scope.total = 0;
                $scope.subTotal = 0;
                $scope.shipping = 0;

                $scope.promotions = [];

                var date = new Date();


                orders.forEach(function (o) {
                    $scope.total += o.total;
                    $scope.subTotal += o.subTotal;
                    $scope.shipping += o.shipping;
                    date = o.expectedArrivedDate;
                    $scope.expectedArrivedDate = $filter('date')(date, 'yyyy-MM-dd');

                    o.promotions.forEach(function (p) {
                        $scope.promotions.push(p);
                    })
                });
                var arr = [];

                $scope.chosenItem.forEach(function (orderItem) {
                    if (orderItem.spikeItem) {
                        arr.push({
                            skuId: orderItem.sku.id,
                            quantity: orderItem.quantity,
                            bundle: orderItem.bundle,
                            spikeItemId: orderItem.spikeItem.id,
                            cartSkuType: 2
                        })
                    } else {
                        arr.push({
                            skuId: orderItem.sku.id,
                            quantity: orderItem.quantity,
                            bundle: orderItem.bundle
                        })
                    }
                })
                $scope.cId = $stateParams.cId;

                $scope.hasPromotion = true;
                if( $scope.promotions.length==0) {
                    ProfileService.couponEdit(arr).then(function (data) {
                        $scope.coupons = data.data;
                        //console.log(" coupons : " + JSON.stringify($scope.coupons));
                        ProfileService.setCouponInfo($scope.coupons);

                        var maxDiscount = 0;
                        var endTime = 0;

                        for (var i = 0; i < $scope.coupons.length; i++) {
                            var couponItem = $scope.coupons[i];
                            //如果已经选择了优惠劵直接使用
                            if ($scope.cId != undefined && couponItem.id == $scope.cId) {
                                $scope.thisCoupon = couponItem;
                                break;
                            }

                            //寻找最佳的优惠劵
                            if (maxDiscount == 0 && endTime == 0) {
                                maxDiscount = couponItem.coupon.discount;
                                endTime = couponItem.end;
                                $scope.thisCoupon = couponItem;
                            }

                            if (maxDiscount < couponItem.coupon.discount || (maxDiscount == couponItem.coupon.discount && endTime > couponItem.endTime)) {
                                $scope.thisCoupon = couponItem;
                                maxDiscount = couponItem.coupon.discount;
                                endTime = couponItem.endTime;
                            }

                        }


                        if ($scope.thisCoupon) {
                            $scope.hasPromotion = false;
                            $scope.total = $scope.total - $scope.thisCoupon.coupon.discount;
                            if ($scope.total < 0) {
                                $scope.total = 0;
                            }
                            $scope.thisCoupon.chosen = true;
                        } else {
                            $scope.hasPromotion = true;
                        }
                    });
                }
            });
        };

        $scope.previewOrder();

        $scope.submitOrder = function (cart) {
            var submitOrderConfirm = $ionicPopup.confirm({
                template: '<center>是否确认订单？</center>',
                cancelText: '取消',
                cancelType: 'button-default',
                okText: '确定',
                okType: 'button-assertive'
            });
            submitOrderConfirm.then(function (res) {
                if (res) {
                    var form = [];
                    $scope.chosenItem = CartService.getChosenItem();
                    $scope.chosenItem.forEach(function (orderItem) {
                        if (orderItem.spikeItem) {
                            form.push({
                                skuId: orderItem.sku.id,
                                quantity: orderItem.quantity,
                                bundle: orderItem.bundle,
                                spikeItemId: orderItem.spikeItem.id,
                                cartSkuType: 2
                            })
                        } else {
                            form.push({
                                skuId: orderItem.sku.id,
                                quantity: orderItem.quantity,
                                bundle: orderItem.bundle
                            })
                        }

                    })

                    var deviceId = DeviceUtil.deviceId;
                    if ($scope.thisCoupon != undefined) {
                        var data = {
                            skuarray: form,
                            couponId: $scope.thisCoupon.id,
                            deviceId: deviceId
                        }
                    } else {
                        var data = {
                            skuarray: form,
                            couponId: null,
                            deviceId: deviceId
                        }
                    }

                    OrderService.submitOrder(data).then(function (orders) {
                        CartService.resetCart();
                        CartService.getCart();

                        ProfileService.getProfile().then(function () {
                            Analytics.trackEvent('cart', 'click', 'submitOrder');
                        })

                        if (orders.length == 1) {
                            $state.go("order-detail", {id: orders[0].id, confirmStatus: 1});
                        } else {
                            $state.go("order-list");
                        }
                    }, function (data) {
                        if(data.stockOut && data.stockOut>0){
                            var msg = "";
                            data.stockOut.forEach(function(dataItem){
                                if(dataItem.outOfInfo.spikeActivityState==2){
                                    var leftoverNum = dataItem.outOfInfo.num-dataItem.outOfInfo.takeNum;
                                    if(leftoverNum>0){
                                        if(dataItem.outOfInfo.customerTakeNum<dataItem.outOfInfo.perMaxNum){
                                            if(dataItem.outOfInfo.customerTakeNum+dataItem.outOfInfo.currentBuyQuantity>=dataItem.outOfInfo.perMaxNum){
                                                $scope.canBuy = dataItem.outOfInfo.perMaxNum - dataItem.outOfInfo.customerTakeNum;
                                                if(leftoverNum< $scope.canBuy) {
                                                    message = "秒杀商品" + vdataItem.outOfInfo.skuName + "您已经购买了" + dataItem.outOfInfo.customerTakeNum + "件，抱歉库存不足，您还可以购买" + leftoverNum + "件";
                                                }else{
                                                    message = "秒杀商品"+vdataItem.outOfInfo.skuName+"您已经购买了" + dataItem.outOfInfo.customerTakeNum +"件，还可以购买"+$scope.canBuy+"件";
                                                }

                                            }

                                        }else{
                                            msg+=dataItem.outOfInfo.skuName+"已经买够了活动限购数量";
                                        }
                                    }else{
                                        msg+=dataItem.outOfInfo.skuName+"已经抢光了！";


                                    }

                                }else{
                                    msg=dataItem.outOfInfo.skuName+"抢购结束";

                                }
                            })
                            AlertService.alertMsg(msg);
                        }else{
                            AlertService.alertMsg(data.errmsg);
                        }


                    });
                } else {
                    return;
                }
            });
        }

        $scope.gotoCouponEdit = function () {
            if ($scope.coupons && $scope.coupons.length > 0) {
                $state.go('couponEdit');
            }
        }

        //商品详情页
        $scope.productDetail = function (skuId, spikeItem) {
            $scope.burl = $location.url()
            if (spikeItem) {
                $state.go("seckillProduct-detail", {
                    activeId: spikeItem.spikeId,
                    itemId: spikeItem.id,
                    backUrl: $scope.burl
                });
            } else {
                $state.go("product-detail", {id: skuId, backUrl: $scope.burl});
            }

        }

    })