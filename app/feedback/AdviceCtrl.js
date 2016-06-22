angular.module('cgwy')
    .controller('AdviceCtrl', function ($scope, $ionicPopup, ProfileService, Analytics,AlertService,FeedbackService,$state) {

        $scope.form = {

            content: ''

        };


        ProfileService.getProfile().then(function (profile) {
            $scope.profile = profile;

        });

        $scope.submitAdvice = function(form) {


            if(form.content === "") {
                AlertService.alertMsg("请填写反馈意见或建议");
                return;
            }

            FeedbackService.advice($scope.profile.restaurant[0].id,$scope.form.content).then(function () {
                AlertService.alertMsg("反馈成功，我们会尽快处理").then(function() {
                    $state.go("main.profile")
                });
            })


        }

    });