angular.module('cgwy')
    .controller('ProductCtrl', function (BackUrlUtil, $scope, $ionicPopup, $location, $stateParams, $rootScope, $state, $ionicListDelegate, $ionicScrollDelegate, $ionicPopover, $cordovaToast, $q, ProductService, CategoryService, ProfileService, CartService, FavoriteService, Analytics, $timeout, LocationService, HistoryDataCacheUtil) {
        //$scope.showLoading = true;
        var cacheKey = "PRODUCT-LIST-DATA";
        var pageDataCache = {};


        ProfileService.getProfile().then(function (profile) {
            if (profile) {
                $scope.profile =true;
                CartService.getCart();
            }else{
                $scope.profile =false;
            }
        });

        $scope.scrollInitialized = false;

        if ($stateParams.categoryId) {
            $scope.categorySelectedId = $stateParams.categoryId;
        }

        if ($stateParams.mainParentCategoryId) {
            BackUrlUtil.setParamers($stateParams.mainParentCategoryId);
        }


        $scope.back = function () {
            //清空数据缓存和当前页面焦点
            HistoryDataCacheUtil.delObj(cacheKey);
            $state.go("main.category");
        }

        $scope.criteria = {
            categoryId: $stateParams.categoryId,
            brandId: $stateParams.brandId,
            name: $stateParams.query,
            sortProperty: $stateParams.sortProperty ? $stateParams.sortProperty : 'salesCount',
            sortDirection: $stateParams.sortDirection,
            page: 0,
            pageSize: 10
        }

        if (LocationService.getChosenCity()) {
            $scope.criteria.cityId = LocationService.getChosenCity().id;
        }

        $scope.reset = function (criteria) {
            criteria.page = 0;
            $scope.skusDisplayed = [];

            if ($scope.scrollInitialized) {
                $ionicScrollDelegate.scrollTop(true);
            } else {
                $scope.scrollInitialized = true;
            }
            $scope.moreDataCanBeLoaded = true;
        }

        $scope.moreDataCanBeLoaded = true;

        $scope.total = 0;

        $scope.inProcess = [];


        $scope.loadMore = function () {
            $scope.criteria.page++;

            ProductService.findSkus($scope.criteria).then(function (data) {
                if (data.skus.length > 0) {
                    /*$scope.datas.push(data)
                    data.skus.forEach(function (sku) {
                        $scope.show(sku);
                        sku.quantity = 1;
                        $scope.skusDisplayed.push(sku);
                    });*/
                    FavoriteService.getFavorites().then(function (favorites) {
                        for (var i = 0; i < data.skus.length; i++) {
                            data.skus[i].favoriteStatus = false;
                            for (var j = 0; j < favorites.length; j++) {
                                if (data.skus[i].id == favorites[j].sku.id) {
                                    data.skus[i].favoriteStatus = true;
                                }
                            }
                            $scope.show(data.skus[i]);
                            $scope.skusDisplayed.push(data.skus[i]);
                        }

                    })
                } else {
                    $scope.moreDataCanBeLoaded = false;
                }

                $scope.$broadcast('scroll.infiniteScrollComplete');
            })
        }

        $scope.sortBtnClass = 'salesCount';
        $scope.status = true;
        $scope.resort = function (sortProperty) {
            $scope.status = false;
            if (sortProperty == $scope.criteria.sortProperty) {
                if ($scope.criteria.sortDirection == 'asc') {
                    $scope.criteria.sortDirection = 'desc';
                } else {
                    $scope.criteria.sortDirection = 'asc';
                }
            } else if (sortProperty == 'salesCount') {
                $scope.status = true;
                $scope.criteria.sortProperty = sortProperty;
                $scope.criteria.sortDirection = 'desc';
            } else if (sortProperty == 'marketPrice') {
                $scope.criteria.sortProperty = sortProperty;
                $scope.criteria.sortDirection = 'asc';
            }

            $scope.sortBtnClass = sortProperty;

            $scope.findSkus($scope.criteria);
        }

        $scope.selectBrand = function (brandId) {
            $scope.brandSelectedId = brandId;
            if (brandId) {
                $scope.criteria.brandId = brandId;
            } else {
                $scope.criteria.brandId = null;
            }

            $scope.findSkus($scope.criteria);

            $scope.showBrands.hide();
        }

        $scope.selectCategory = function (category) {
            $scope.categorySelectedId = category.id;
            $scope.criteria.categoryId = category.id;
            $scope.category = category;

            $scope.criteria.brandId = null;

            $scope.findSkus($scope.criteria);
            $scope.groupBrands($scope.criteria);
            $scope.showCategories.hide();
        }

        $scope.brands = [];

        $scope.isSearch = true;

        if ($stateParams.categoryId) {
            CategoryService.getCategory($stateParams.categoryId).then(function (data) {
                $scope.category = data;
                CategoryService.getLevel($stateParams.categoryId).then(function (level) {
                    if (level == 3) {
                        CategoryService.getParentCategory($stateParams.categoryId).then(function (parent) {
                            if (parent) {
                                parent.children.forEach(function (parentItem) {
                                    if ($stateParams.parentCategoryId == parentItem.id) {
                                        $scope.siblingCategories = parentItem.children;
                                    }
                                })
                                //$scope.siblingCategories = parent.children;
                            }
                        });
                    } else if (level == 2) {
                        $scope.siblingCategories = data.children;
                    }
                });
            });
            $scope.isSearch = false;
        }

        /*获取收藏列表的数据*/


        $scope.skusDisplayed = [];
        $scope.datas = []
        $scope.findSkus = function (criteria) {
            $scope.reset(criteria);

            var pageDataCache = HistoryDataCacheUtil.delObj(cacheKey);
            //console.log("pageDataCache : " + JSON.stringify(pageDataCache));
            if (pageDataCache != null) {
                $scope.skusDisplayed = pageDataCache.listData;
                $scope.criteria = pageDataCache.criteria;
                $scope.to = true;
                $timeout(function () {
                    $ionicScrollDelegate.scrollTo(0, pageDataCache.topPoi, false);
                }, 100);
            } else {
                ProductService.findSkus(criteria).then(function (data) {

                    $scope.data = data;
                    $scope.datas.push($scope.data);

                    /*data.skus.forEach(function (sku) {
                     $scope.show(sku);
                     $scope.skusDisplayed.push(sku);
                     console.log(sku);
                     });*/
                    ProductService.miaoSha($scope.criteria.cityId).then(function(data){
                        var spikeArray = data.data.spike;
                        var _activityStartDate = 0;
                        var spike = null;
                        console.log(spikeArray);
                        if(data.data.spike.length>0){
                            for(var i=0; i<spikeArray.length; i++){
                                //获取离当前时间最近的活动
                                if(_activityStartDate == 0 || _activityStartDate > spikeArray[i].beginTime){
                                    spike = spikeArray[i];
                                    _activityStartDate = spike.beginTime;
                                }
                            }
                            $scope.activityId = spike.id;
                            /*秒杀商品*/
                            ProductService.seckillProduct($scope.activityId).then(function(datas){
                                $scope.seckillProuduct = datas;
                                console.log($scope.seckillProuduct);
                            })
                        }
                    })
                    FavoriteService.getFavorites().then(function (favorites) {

                        for (var i = 0; i < data.skus.length; i++) {
                            data.skus[i].favoriteStatus = false;
                            data.skus[i].miaoshaStatus = false;
                            for (var j = 0; j < favorites.length; j++) {
                                if (data.skus[i].id == favorites[j].sku.id) {
                                    data.skus[i].favoriteStatus = true;
                                }
                            }

                            if($scope.seckillProuduct.length>0){
                                alert(34);
                                for(var k=0; k< $scope.seckillProuduct.length;k++){
                                    if(data.skus[i].id == $scope.seckillProuduct[k].sku.id){
                                        data.skus[i].miaoshaStatus = true;
                                        alert(56);
                                    }
                                }
                            }
                            $scope.show(data.skus[i]);
                            $scope.skusDisplayed.push(data.skus[i]);
                        }

                    })




                    $scope.showLoading = false;

                    $scope.total = data.total;

                    $scope.find = function () {
                        var toast = document.getElementById('find');
                        toast.innerHTML = "为您找到相关商品约" + $scope.total + "个";
                        toast.style.width = "60%";
                        toast.style.left = "20%";
                        toast.style.top = "80%";
                        toast.className = 'fadeIn animated';
                        $timeout(function () {
                            toast.className = 'hide';
                        }, 2000)
                    }

                    $timeout(function () {
                        $scope.find();
                    }, 500);

                    if (data.total == 0) {
                        $scope.to = false;
                    } else {
                        $scope.to = true;
                    }
                })
            }
        };

        $scope.groupBrands = function (criteria) {
            ProductService.groupBrands(criteria).then(function (data) {

                var brands = [];

                brands.push({id: 0, brandName: "全部"})

                data.brands.forEach(function (brand) {
                    brands.push(brand);
                });

                $scope.brands = brands;
                $scope.brandSelectedId = $scope.brands[0].id;
            })
        }


        $scope.searchQuery = function (q) {
            if (typeof q != 'undefined') {
                $scope.criteria.categoryId = null;
                $scope.criteria.brandId = null;
                $scope.criteria.name = q;
                $scope.findSkus($scope.criteria);
            }
        }

        $scope.moreQuantity = function (sku) {
            sku.quantity = sku.quantity + 1;
        }

        $scope.lessQuantity = function (sku) {
            if (sku.quantity > 0) {
                sku.quantity = sku.quantity - 1;
            }
        }

        $scope.dial = function () {
            window.open('tel:' + sessionStorage['CSH'], '_system');
        }

        $scope.addSkuIntoCart = function (sku, quantity, bundle) {
            if ($scope.inProcess[sku.id] == true)
                return;

            $scope.inProcess[sku.id] = true;
            ProfileService.getProfile().then(function (data) {

                if (data) {

                    ProfileService.getCustomerCityId().then(function (cityId) {
                        if (LocationService.getChosenCity() && cityId == LocationService.getChosenCity().id) {

                            var form = [];

                            form.push({skuId: sku.id, quantity: quantity, bundle: sku.c});
                            CartService.addSkuIntoCart(form).then(function () {
                                var toast = document.getElementById('customToast');
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
                            var toast = document.getElementById('customToast');
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

                    if (LocationService.getChosenCity().id === 2) {
                        $scope.rexianPhone = "028-8774-8154";
                    } else {
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


        $scope.markFavorite = function (sku) {
            sku.favoriteStatus = true;
            FavoriteService.markFavorite(sku).then(function () {
                var toast = document.getElementById('customToast');
                toast.style.width = "30%";
                toast.style.left = "35%";
                toast.innerHTML = "收藏成功";
                toast.className = 'fadeIn animated';

                $timeout(function () {
                    toast.className = 'hide';
                }, 2000)

                $ionicListDelegate.closeOptionButtons();
            });

            Analytics.trackEvent('product', 'markFavorite');
        }

        $scope.findSkus($scope.criteria);
        $scope.groupBrands($scope.criteria);

        $scope.orderItemsCount = 0;

        $scope.recount = function () {
            $scope.orderItemsCount = 0;
            CartService.getOrderItemCount().then(function (count) {
                $scope.orderItemsCount = count;
            })
        }

        $scope.recount();

        $ionicPopover.fromTemplateUrl('templates/brandPopover.html', {
            scope: $scope
        }).then(function (popover) {
            $scope.showBrands = popover;
        });

        $ionicPopover.fromTemplateUrl('templates/categoryPopover.html', {
            scope: $scope
        }).then(function (popover) {
            $scope.showCategories = popover;
        });

        $scope.showFavoriteGuide = false;

        if (!window.localStorage['isFavoriteGuideShowed']) {
            $scope.showFavoriteGuide = true;
        }

        $scope.closeFavoriteGuide = function () {
            window.localStorage['isFavoriteGuideShowed'] = true;
            $scope.showFavoriteGuide = false;
        }

        /*是否显示打包，单品价*/
        $scope.show = function (sku) {

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


            sku.showLogo = false;
            if (sku.bundlePrice.bundleAvailable == true && sku.bundlePrice.bundleInSale == false && sku.singlePrice.singleAvailable == false) {
                sku.showLogo = true;
            } else if (sku.singlePrice.singleAvailable === true && sku.singlePrice.singleInSale === false && sku.bundlePrice.bundleAvailable == false) {
                sku.showLogo = true;
            } else if (sku.bundlePrice.bundleAvailable == true && sku.bundlePrice.bundleInSale == false && sku.singlePrice.singleAvailable == true && sku.singlePrice.singleInSale === false) {
                sku.showLogo = true;
            } else {
                sku.showLogo = false;
            }
        }

        /*
         * 控制商品列表打包，单品选项
         * id表示该商品id
         * name:表示选中打包，或者单品选项名称
         * bundle，single：代表打包/单品，布尔值，ture，选中打包、单品，false,没选中*/

        $scope.oneChange = function (id, name, bundle, single) {
            for (var d = 0; d < $scope.skusDisplayed.length; d++) {
                var dataItem = $scope.skusDisplayed[d];
                dataItem.seletedId = id;
                if (dataItem.seletedId == dataItem.id) {
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
        $scope.productDetail = function (skuId,favoriteStatus) {
            if(favoriteStatus==true){
                $scope.favoriteStatus = 1;
            }else{
                $scope.favoriteStatus = 0;
            }
            setCache();
            $state.go("product-detail", {id: skuId, categoryId: $scope.categoryId,favoriteStatus:$scope.favoriteStatus});
        }

        $scope.gotoCart = function () {
            setCache();
            $state.go("cart", {backUrl: $location.url()});
        }


        function setCache() {
            pageDataCache.topPoi = $ionicScrollDelegate.getScrollPosition().top; //向下级跳转时记录当前点位
            pageDataCache.curTime = (new Date()).valueOf()
            pageDataCache.listData = $scope.skusDisplayed;
            pageDataCache.criteria = $scope.criteria;
            HistoryDataCacheUtil.putObj("PRODUCT-LIST-DATA", pageDataCache);

        }
    })
