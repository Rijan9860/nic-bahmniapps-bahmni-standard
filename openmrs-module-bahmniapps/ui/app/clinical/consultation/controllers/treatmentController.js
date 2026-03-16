'use strict';

angular.module('bahmni.clinical')
    .controller('TreatmentController', ['$scope', 'clinicalAppConfigService', 'treatmentConfig', '$stateParams', '$rootScope', 'cdssService', 'appService', '$filter',
        function ($scope, clinicalAppConfigService, treatmentConfig, $stateParams, $rootScope, cdssService, appService, $filter) {
            $scope.enableNepaliCalendar = appService.getAppDescriptor().getConfigValue('enableNepaliCalendar');
            $scope.displayNepaliDates = appService.getAppDescriptor().getConfigValue('displayNepaliDates');
            console.log("Display Nepali Dates", $scope.displayNepaliDates);
            $scope.npToday = Bahmni.Common.Util.DateUtil.npToday();
            var init = function () {
                var drugOrderHistoryConfig = treatmentConfig.drugOrderHistoryConfig || {};
                $scope.drugOrderHistoryView = drugOrderHistoryConfig.view || 'default';
                $scope.tabConfigName = $stateParams.tabConfigName || 'default';
                var extensionParams = appService.getAppDescriptor().getExtensionById("bahmni.clinical.billing.treatment").extensionParams;
                $scope.medicationTabDisplayControls = extensionParams && extensionParams.sections ? extensionParams : {sections: {}};
                var dashboard = Bahmni.Common.DisplayControl.Dashboard.create($scope.medicationTabDisplayControls || {}, $filter);
                $scope.sectionGroups = dashboard.getSections([]);

                var initializeTreatments = function () {
                    $scope.consultation.newlyAddedTabTreatments = $scope.consultation.newlyAddedTabTreatments || {};
                    $scope.consultation.newlyAddedTabTreatments[$scope.tabConfigName] = $scope.consultation.newlyAddedTabTreatments[$scope.tabConfigName] || {treatments: [], orderSetTreatments: [], newOrderSet: {}};
                    $scope.treatments = $scope.consultation.newlyAddedTabTreatments[$scope.tabConfigName].treatments;
                    $scope.orderSetTreatments = $scope.consultation.newlyAddedTabTreatments[$scope.tabConfigName].orderSetTreatments;
                    $scope.newOrderSet = $scope.consultation.newlyAddedTabTreatments[$scope.tabConfigName].newOrderSet;
                };

                var getPreviousDrugAlerts = function () {
                    var treatments = $scope.treatments;
                    treatments && treatments.forEach(function (drugOrder) {
                        var drug = drugOrder.drug;
                        var cdssAlerts = angular.copy($rootScope.cdssAlerts);
                        if (!cdssAlerts) return;
                        drugOrder.alerts = cdssAlerts.filter(function (cdssAlert) {
                            return cdssAlert.referenceMedications.some(function (
                            referenceMedication
                        ) {
                                return referenceMedication.coding.some(function (
                            coding
                            ) {
                                    return (
                                drug.uuid === coding.code ||
                                drug.name === coding.display
                                    );
                                });
                            });
                        });
                        drugOrder.alerts = cdssService.sortInteractionsByStatus(drugOrder.alerts);
                    });
                };

                $scope.$watch('consultation.newlyAddedTabTreatments', initializeTreatments);
                $rootScope.$watch('cdssAlerts', function () {
                    if (!$rootScope.cdssAlerts) return;
                    getPreviousDrugAlerts();
                }, true);

                $scope.enrollment = $stateParams.enrollment;
                $scope.treatmentConfig = treatmentConfig;
            };

            $scope.handleDateUpdate = function (treatment) {
                console.log("Entered Handle Date Update");
                var treatmentStartDate = treatment.effectiveStartDate;
                console.log("Treatment Start Date", treatmentStartDate);
                treatment.effectiveStartDateNepali = convertAdToBs(treatmentStartDate);
            };

            $scope.handleOrderSetDateUpdate = function (newOrderSet) {
                console.log("Entered Handle Order Set Update");
                var orderSetDate = newOrderSet.date;
                console.log("Order Set Date", orderSetDate);
                newOrderSet.nepaliDate = convertAdToBs(orderSetDate);
            };

            $scope.handleNepaliDateUpdate = function (treatment) {
                console.log("Handle Nepali Date Update");
                var nepaliDate = treatment.effectiveStartDateNepali;
                console.log("Nepali Date", nepaliDate);
                treatment.effectiveStartDate = convertBsToAd(nepaliDate);
            };

            $scope.handleOrderSetNepaliDateUpdate = function (newOrderSet) {
                console.log("Entered Handle Order Set Nepali Date");
                var nepaliDate = newOrderSet.nepaliDate;
                console.log("Nepali Date", nepaliDate);
                newOrderSet.date = convertBsToAd(nepaliDate);
            };

            var convertAdToBs = function (date) {
                if (date) {
                    var nepaliDate = calendarFunctions.getBsDateByAdDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
                    return calendarFunctions.bsDateFormat("%y-%m-%d", nepaliDate.bsYear, nepaliDate.bsMonth, nepaliDate.bsDate);
                }
                else {
                    return '';
                }
            };

            var convertBsToAd = function (nepaliDate) {
                if (nepaliDate) {
                    var dateStr = nepaliDate.split("-");
                    var dateAd = calendarFunctions.getAdDateByBsDate(calendarFunctions.getNumberByNepaliNumber(dateStr[0]), calendarFunctions.getNumberByNepaliNumber(dateStr[1]), calendarFunctions.getNumberByNepaliNumber(dateStr[2]));
                    var date = new Date(dateAd);
                    console.log("Date", date);
                    return date;
                }
                else {
                    return '';
                }
            };

            init();
        }]);
