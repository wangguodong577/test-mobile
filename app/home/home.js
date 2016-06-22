angular.module('cgwy')
    .controller('HomeCtrl', function ($scope, $ionicPopup, $stateParams, $ionicSlideBoxDelegate, $state, $ionicPopover, UpdateService, OrderService, ProfileService, ActivityService, Analytics, AlertService, LocationService, CartService, $rootScope, DeviceUtil, ProductService,$timeout) {
        function showBanner(loginStatus) {
            if (ActivityService.banners && ActivityService.banners.length > 0) {

                if(loginStatus){
                    $scope.banners = ActivityService.banners;
                }else{
                    $scope.banners = ActivityService.banners;
                    $scope.banners.forEach(function(banner){
                        banner.redirectUrl = null;
                    })
                }
                $ionicSlideBoxDelegate.update();
            }

            if (ProfileService.isDisplayWelcome()) {
                if (ActivityService.welcomeContent) {
                    var alertPopup = $ionicPopup.alert({
                        template: "<div class='push'>" + ActivityService.welcomeContent.welcomeTitle + "</div><br><div class='push-body'>" + ActivityService.welcomeContent.welcomeMessage + "</div>",
                        okText: '我知道了',
                        okType: 'button-light'
                    });

                    ProfileService.setDisplayWelcome(false);
                } else {
                    ActivityService.reloadActivities().then(function (d) {
                        if (ActivityService.welcomeContent) {
                            var alertPopup = $ionicPopup.alert({
                                template: "<div class='push'>" + ActivityService.welcomeContent.welcomeTitle + "</div><br><div class='push-body'>" + ActivityService.welcomeContent.welcomeMessage + "</div>",
                                okText: '我知道了',
                                okType: 'button-light'
                            });

                            ProfileService.setDisplayWelcome(false);
                        }
                    });
                }
            }

            $scope.bannerActivity = function(){
                var toast = document.getElementById('customToast');
                toast.style.width = "60%";
                toast.style.left = "20%";
                toast.innerHTML = "登录后才能看到活动详情哦";
                toast.className = 'fadeIn animated';
                $timeout(function () {
                    toast.className = 'hide';
                }, 10000)
            }

        }

        $scope.isNullTodayOrders = true;

        ProfileService.getProfile().then(function (profile) {
            $scope.profile = profile;

            if (profile) {
                $scope.loignStatus = true;
                if ($rootScope.wxcode) {
                    ProfileService.bindWxCode($rootScope.wxcode);
                }

                ProfileService.getCustomerCityId().then(function (cityId) {
                    $scope.currentLoginCityId = cityId;

                    switch (cityId) {
                        case 1:
                            $scope.currentCity = "北京";
                            break;
                        case 2:
                            $scope.currentCity = "成都";
                            break;
                        case 3:
                            $scope.currentCity = "杭州";
                            break;
                        case 4:
                            $scope.currentCity = "济南";
                            break;
                        case 5:
                            $scope.currentCity = "长春";
                            break;
                        default:
                            $scope.currentCity = "北京";
                    }

                    try{
                        window.plugins.jPushPlugin.setTags([$scope.currentCity]); //设置推送tag
                    }catch(e){
                        console.log("JPush plugin is undefined -- setTags");
                    }

                    LocationService.chooseCity(cityId, $scope.currentCity);
                    loadActivity($scope.loignStatus); //根据城市ID加载活动
                });

                OrderService.getTodayOrders().then(function (orders) {
                    $scope.todayOrders = orders;

                    if (orders && orders.length > 0) {
                        $scope.isNullTodayOrders = false;
                    } else {
                        $scope.isNullTodayOrders = true;
                    }
                })
            } else {
                $scope.loignStatus = false;
                //如果登录则取用户注册城市,否则定位城市
                LocationService.locationCity().then(function (CityMessage) {
                    $scope.currentCity = CityMessage.city;
                    loadActivity($scope.loignStatus); //根据定位城市ID查询活动
                }, function (err) {
                    $scope.currentCity = "北京";
                    LocationService.chooseCity(1, $scope.currentCity);
                });
            }
        })

        // 客服热线 Customer Service Hotline
        $scope.CSH = "400-898-1100"; // 北京客服
        $scope.dial = function () {
            window.open('tel:' + sessionStorage['CSH'], '_system');
        }

        $scope.contact = function (truckerTel) {
            var contactConfirm = $ionicPopup.confirm({
                template: '<center style="margin-left: -12px;margin-right: -12px;">确定要拨打您此单的司机电话？<div style="color: red;margin-bottom: -10px;">' + truckerTel + '</div></center>',
                cancelText: '取消',
                cancelType: 'button-default',
                okText: '拨打',
                okType: 'button-assertive'
            });
            contactConfirm.then(function (res) {
                if (res) {
                    window.open('tel:' + truckerTel, '_system');
                } else {
                    return;
                }
            });
        };

        $scope.isShowContactBtn = function (orderSubmitDate) {
            var result = false;
            var date = new Date();//当前时间
            var submitOrderDate = new Date(orderSubmitDate);
            submitOrderDate.setDate(submitOrderDate.getDate() + 1);//订单提交时间24小时之后

            if (typeof orderSubmitDate == 'undefined' || orderSubmitDate == null) {
                result = false;
            } else {
                if (date.getHours() >= 13 && submitOrderDate.getDate() == date.getDate()) {
                    result = true;
                }
            }

            return result;
        }

        //判断是否是登陆了，登陆了不显示首页已经开通的城市
        ProfileService.getProfile().then(function (profile) {
            if (!profile) {
                $scope.showDown = false;
                $ionicPopover.fromTemplateUrl('templates/citySelectPopover.html', {
                    scope: $scope
                }).then(function (popover) {
                    $scope.citySelectPopover = popover;
                });
            } else {
                $scope.showDown = true;
            }

        });

        LocationService.getCities().then(function (cities) {
            $scope.openCities = cities;
        });


        function loadActivity(loginStatus) {
            var cityId = LocationService.getChosenCity().id;
            //alert(ActivityService.welcomeContent);
            if (cityId == ActivityService.cityId) {
                if (ActivityService.banners && ActivityService.banners.length > 0) {
                    showBanner(loginStatus);
                }
            } else {
                ActivityService.reloadActivitiesByCityId(cityId).then(function () {
                    ActivityService.cityId = cityId;
                    showBanner(loginStatus);
                })
            }
        }

        $scope.currentCityClick = function () {
            $scope.citySelectPopover.hide();
        };

        $scope.citySelected = function (openCityId) {
            $scope.citySelectPopover.hide();

            for (var i = 0; i < $scope.openCities.length; i++) {
                if ($scope.openCities[i].id === openCityId) {
                    $scope.currentCity = $scope.openCities[i].name;
                    LocationService.chooseCity($scope.openCities[i].id, $scope.openCities[i].name);
                }
            }
        };

        $scope.orderAgain = function (order) {
            if (order.orderItems) {
                var array = [];
                order.orderItems.forEach(function (orderItem) {
                    array.push({skuId: orderItem.sku.id, quantity: orderItem.quantity});
                });

                CartService.addSkuIntoCart(array).then(function () {
                    $state.go('cart', {backUrl: '/main/home'});
                });
            }
        };

        var deviceId = DeviceUtil.deviceId;
        $scope.orderCancel = function (orderId) {
            var orderCancelConfirm = $ionicPopup.confirm({
                template: '<center>确定取消该订单？</center>',
                cancelText: '取消',
                cancelType: 'button-default',
                okText: '确定',
                okType: 'button-assertive'
            });
            orderCancelConfirm.then(function (res) {
                if (res) {
                    OrderService.cancelOrder({orderId: orderId, deviceId: deviceId}).then(function (data) {
                        OrderService.getTodayOrders().then(function (orders) {
                            $scope.todayOrders = orders;

                            if (orders && orders.length > 0) {
                                $scope.isNullTodayOrders = false;
                            } else {
                                $scope.isNullTodayOrders = true;
                            }
                        });
                    });
                } else {
                    return;
                }
            });
        };


        /*秒杀活动*/
        var timer; //定时器
        var productShow; //用来判断是否可以点击显示秒杀活动商品
        var span = document.getElementById("timeSpan");

        if(LocationService.getChosenCity()){
            $scope.activeCityId = LocationService.getChosenCity().id;
        }else{
            $scope.activeCityId = 1;
        }

        ProductService.miaoSha($scope.activeCityId).then(function (response) {

            $scope.miaoShaData = response.data;
            $scope.data = response.data;
            var serverTime = new Date($scope.data.sysdate);
            var spikeArray = $scope.data.spike;
            productShow = false;
            $scope.showStatus = false;
            var _activityStartDate = 0;

            var spike = null;
            for(var i=0; i<spikeArray.length; i++){
                //获取离当前时间最近的活动
                if(_activityStartDate == 0 || _activityStartDate > spikeArray[i].beginTime){
                    spike = spikeArray[i];
                    _activityStartDate = spike.beginTime;
                }
            }


            $scope.spikeCur = spike;
            $scope.activityId = spike.id;
            var activityStart = spike.beginTime < serverTime.getTime(); //活动已经开始
            var activityEnd = spike.endTime < serverTime.getTime(); //活动已经结束

            //获取到活动开始,结束的日期
            var begin = new Date(spike.beginTime);
            var end = new Date(spike.endTime);

            //秒杀模块在活动当天0点显示,用服务器时间与秒杀活动时间做比较，如果是同一天，并且服务器返回的是0时0分就显示
            var beginMonth = begin.getMonth()+1;
            var serveMonth = serverTime.getMonth()+1;
            var activityDate = begin.getFullYear()+"/"+beginMonth+"/"+begin.getDate();
            var serveDate = serverTime.getFullYear()+"/"+serveMonth+"/"+serverTime.getDate();

            var serveHours= serverTime.getHours();
            var serveMin= serverTime.getMinutes();

            var activityStatus = false;
            if(activityDate == serveDate) {
                if(serveHours >= 0 && serveMin >= 0){
                    activityStatus = true;
                }
            }

            //当天有活动并且活动没有开始
            if (!activityStart && activityStatus == true) {
                //活动开始前，显示活动开始时间到结束时间
                $scope.beginH = begin.getHours();
                $scope.beginM = begin.getMinutes();

                $scope.endH = end.getHours();
                $scope.endM = end.getMinutes();
                $scope.time =  $scope.addZero($scope.beginH )+ ":" +$scope.addZero($scope.beginM )  + "-" + $scope.addZero($scope.endH) + ":" +  $scope.addZero($scope.endM);
                $scope.showStatus = true;
                productShow = $scope.timeStatus = false;

            } else if (activityStart && !activityEnd) {
                productShow = $scope.showStatus = true;
                //活动开始
                timer = window.setInterval(function () {
                    var nowTime = new Date();
                    span.innerHTML = $scope.qiangGou(nowTime,  spike.endTime);
                }, 1000);

            } else if (activityEnd) {
                window.clearInterval(timer);
                timer = null;
                $scope.showStatus = false;
                productShow = false;
            }
        })


        $scope.qiangGou = function (nowTime, targetTime) {
            var str;
            var spanTime = targetTime - nowTime.getTime();//总毫秒差
            if (spanTime > 0) {
                timeShow = $scope.timeStatus = true;
                $scope.spanHour = $scope.addZero(Math.floor(spanTime / (1000 * 60 * 60)));//总毫秒中包含多少个小时
                $scope.hourMs = $scope.spanHour * 60 * 60 * 1000;//hour所占毫秒

                $scope.spanMinu = $scope.addZero(Math.floor((spanTime - $scope.hourMs) / (1000 * 60)));//总毫秒中包含多少个分钟
                $scope.minuMs = $scope.spanMinu * 60 * 1000;//minute所占的毫秒

                $scope.spanSeco = $scope.addZero(Math.floor((spanTime - $scope.hourMs - $scope.minuMs) / 1000));//总毫秒中包含多少个秒
                str = "<div class='timeStyle'>" + $scope.spanHour + "</div>" + ":" + "<div class='timeStyle'>" + $scope.spanMinu + "</div>" + ":" + "<div class='timeStyle'>" + $scope.spanSeco + "</div>";
            } else {
                timeShow = $scope.timeStatus = false;
                str = "";
            }
            return str;
        }


        //判断时间是不是小于10，小则添0
        $scope.addZero = function (num) {
            return num = num > 9 ? num : "0" + num;
        }

        $scope.showActiveProduct = function () {
            if(productShow==true){
                $scope.productShow = 1;
            }else{
                $scope.productShow = 0;
            }
            $state.go('seckill-product', {activeId: $scope.activityId,status:$scope.productShow});

        }


        /*首页爆品*/

        $scope.criteria = {
            cityId:$scope.activeCityId,
            type:0
        }

        $scope.skusDisplayed = [];
        $scope.inProcess = [];

        $scope.findHot = function (criteria) {
            ProductService.hotProduct(criteria).then(function (data) {

                $scope.data = data;
                data.skus.forEach(function (sku) {
                    $scope.show(sku);
                    $scope.skusDisplayed.push(sku);

                });

                $scope.showLoading = false;

                $scope.total = data.total;
            })

        };
        $scope.findHot($scope.criteria);


        /* $scope.criteria = {
         categoryId: 401,
         page: 0,
         pageSize: 10
         }
         $scope.skusDisplayed = [];
         $scope.inProcess = [];

         $scope.findSkus = function (criteria) {
         ProductService.findSkus(criteria).then(function (data) {

         $scope.data = data;
         data.skus.forEach(function (sku) {
         $scope.show(sku);
         $scope.skusDisplayed.push(sku);

         });

         $scope.showLoading = false;

         $scope.total = data.total;
         })

         };
         $scope.findSkus($scope.criteria);*/


        /*是否显示打包，单品价*/
        $scope.show = function(sku){

            /*是否有打包价*/
            if (sku.bundlePrice.bundleAvailable === true && sku.bundlePrice.bundleInSale === true) {
                $scope.productBundle = true;
            } else {
                $scope.productBundle = false;
            }
            //是否有单品价
            if (sku.singlePrice.singleAvailable === true && sku.singlePrice.singleInSale === true) {
                $scope.productSingle = true;
            } else {
                $scope.productSingle = false;
            }
            sku.b = $scope.productBundle;
            sku.s = $scope.productSingle;

            /*默认显示打包产品*/
            if (sku.b == true && sku.s == true) {
                sku.d = false;
            }
            if (sku.b == true) {
                sku.c = true;
            } else {
                sku.c = false;
            }
            if(sku.b== true && sku.s ==true){
                sku.jiage = false;
            }else{
                sku.jiage = true;
            }
            sku.quantity = 1;
            sku.bundleName = "bundleName";
            sku.singleName = "singleName";
        }

        /*
         * 控制商品列表打包，单品选项
         * id表示该商品id
         * name:表示选中打包，或者单品选项名称
         * bundle，single：代表打包/单品，布尔值，ture，选中打包、单品，false,没选中
         */

        $scope.oneChange = function (id, name,bundle,single) {
            for(var d=0; d<$scope.skusDisplayed.length;d++){
                var dataItem = $scope.skusDisplayed[d];
                dataItem.seletedId = id;
                if(dataItem.seletedId == dataItem.id){
                    if (name == "bundleName") {
                        if (bundle == true) {
                            dataItem.c = true;
                            dataItem.d = false;
                        } else {
                            dataItem.c = false;
                            dataItem.d = true;
                        }
                    } else if (name == "singleName") {
                        if (single == true) {
                            dataItem.c = false;
                            dataItem.d = true;
                        } else {
                            dataItem.c = true;
                            dataItem.d = false;
                        }
                    }
                }
            }
        }

        //商品详情页
        $scope.categoryId = $stateParams.categoryId;
        $scope.productDetail = function (skuId) {
            state.go("product-detail", {id: skuId,categoryId:$scope.categoryId});
        }

        $scope.moreQuantity = function (sku) {
            sku.quantity = sku.quantity + 1;
        }

        $scope.lessQuantity = function (sku) {
            if (sku.quantity > 0) {
                sku.quantity = sku.quantity - 1;
            }
        }

        $scope.recount = function () {
            $scope.orderItemsCount = 0;
            CartService.getOrderItemCount().then(function (count) {
                $scope.orderItemsCount = count;
            })
        }
        $scope.recount();

        $scope.addSkuIntoCart = function (sku, quantity, bundle) {
            if($scope.inProcess[sku.id] == true)
                return;

            $scope.inProcess[sku.id] = true;
            ProfileService.getProfile().then(function (data) {

                if (data) {

                    ProfileService.getCustomerCityId().then(function (cityId) {
                        if (LocationService.getChosenCity() && cityId == LocationService.getChosenCity().id) {

                            var form = [];

                            form.push({skuId: sku.id, quantity: quantity, bundle: sku.c});
                            CartService.addSkuIntoCart(form).then(function () {
                                var toast = document.getElementById('customHot');
                                toast.innerHTML = "添加成功";
                                toast.className = 'fadeIn animated';
                                $timeout(function () {
                                    toast.className = 'hide';
                                }, 2000)
                                $scope.recount();

                                $scope.inProcess[sku.id] = false;
                            }, function (err) {
                                $scope.inProcess[sku.id] = false;
                            });

                            Analytics.trackEvent('cart', 'click', 'addSku');
                        } else {
                            var toast = document.getElementById('customHot');
                            toast.style.width = "40%";
                            toast.style.left = "30%";
                            toast.innerHTML = "不支持跨城市购买";
                            toast.className = 'fadeIn animated';
                            $timeout(function () {
                                toast.className = 'hide';
                            }, 2000)
                        }
                    })

                } else {

                    if(LocationService.getChosenCity().id === 2){
                        $scope.rexianPhone = "028-8774-8154";
                    }else{
                        $scope.rexianPhone = "400-898-1100";
                    }

                    var loginConfirm = $ionicPopup.confirm({
                        template: '<center><div><font color="red">' + $scope.rexianPhone + '</font></div>采购产品请先注册或登录</center>',
                        cancelText: '取消',
                        cancelType: 'button-default',
                        okText: '登录/注册',
                        okType: 'button-assertive'
                    });
                    loginConfirm.then(function (res) {
                        if (res) {
                            $state.go("main.profile");
                        } else {
                            return;
                        }
                    });

                    $scope.inProcess[sku.id] = false;
                }
            }, function (err) {
                $scope.inProcess[sku.id] = false;
            });
        }
        $scope.backUrl = "/main/home";
        $scope.productDetail = function (skuId) {
            $state.go("product-detail", {id: skuId,categoryId:$scope.categoryId,backUrl:$scope.backUrl});
        }

        /*获取是否具有新的优惠券*/
        ProfileService.getProfile().then(function (profile) {
            $scope.profile = profile;
            if (profile) {
                ProfileService.moreCoupon().then(function(data){
                    if(data.data.total>0){
                        var contactConfirm = $ionicPopup.confirm({
                            template: '<center style="margin-left: -12px;margin-right: -12px;">有' +data.data.total + '张新增优惠券已经放入您的账户中了！</center>',
                            okText: '查看',
                            okType: 'button-assertive',
                            cancelText: '留在首页',
                            cancelType: 'button-default'
                        });
                        contactConfirm.then(function (res) {
                            ProfileService.inputCoupon().then(function(){
                            })
                            if(res){
                                $state.go('coupon');
                            }else{
                                return;
                            }

                        });
                    }
                    return;
                })
            } else {

                return;
            }
        })


    });
