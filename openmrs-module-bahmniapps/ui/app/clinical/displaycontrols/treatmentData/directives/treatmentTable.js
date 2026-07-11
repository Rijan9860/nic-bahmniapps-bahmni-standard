'use strict';

angular.module('bahmni.clinical')
    .directive('treatmentTable', ['appService', function (appService) {
        var controller = function ($scope, $rootScope) {
            $scope.displayNepaliDates = appService.getAppDescriptor().getConfigValue('displayNepaliDates');
            $scope.isOtherActiveSection = function (dateString) {
                return dateString === Bahmni.Clinical.Constants.otherActiveDrugOrders;
            };

            $scope.isDataPresent = function () {
                if ($scope.drugOrderSections && $scope.drugOrderSections.length == 0) {
                    return $scope.$emit("no-data-present-event") && false;
                }
                return true;
            };

            $scope.downloadPrescription = function (visitStartDate, visitUuid) {
                $rootScope.$broadcast("event:downloadPrescriptionFromDashboard", visitStartDate, visitUuid);
            };
            $scope.sharePrescriptions = function (visitStartDate, visitUuid) {
                $rootScope.$broadcast("event:sharePrescriptionsViaEmail", visitStartDate, visitUuid);
            };
        };

        return {
            templateUrl: "displaycontrols/treatmentData/views/treatmentTable.html",
            scope: {
                drugOrderSections: "=",
                params: "="
            },
            controller: controller
        };
    }]);
