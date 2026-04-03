'use strict';

angular.module('bahmni.registration')
    .directive('printOptions', ['$rootScope', 'registrationCardPrinter', 'spinner', 'appService', '$filter',
        function ($rootScope, registrationCardPrinter, spinner, appService, $filter) {
            var controller = function ($scope) {
                $scope.printOptions = appService.getAppDescriptor().getConfigValue("printOptions");
                $scope.defaultPrint = $scope.printOptions && $scope.printOptions[0];
                $scope.prices = $scope.printOptions && $scope.printOptions[0] && $scope.printOptions[0].prices;

                var calculatePriceByVisitType = function () {
                    var visitType = "";
                    console.log("Observations", $scope.observations);
                    for (var i = 0; i < $scope.observations.length; i++) {
                        if ($scope.observations[i].conceptSetName == "Fee Information") {
                            visitType = $scope.observations[i].value;
                        }
                    }
                    if (!Object.keys($scope.prices).includes(visitType)) {
                        return "N/A";
                    }
                    var priceIndex = $scope.patient["NHIS Member Active"] ? 1 : 0;
                    console.log("Price Index", priceIndex);
                    return (
                        visitType + " [ Rs." + $scope.prices[visitType][priceIndex] + " ] "
                    );
                };

                var mapRegistrationObservations = function () {
                    var obs = {};
                    $scope.observations = $scope.observations || [];
                    var getValue = function (observation) {
                        obs[observation.concept.name] = obs[observation.concept.name] || [];
                        observation.value && obs[observation.concept.name].push(observation.value);
                        observation.groupMembers.forEach(getValue);
                    };

                    $scope.observations.forEach(getValue);
                    return obs;
                };

                $scope.print = function (option) {
                    var location = $rootScope.facilityVisitLocation ? $rootScope.facilityVisitLocation : $rootScope.loggedInLocation;
                    var locationAddress = "";
                    var attributeDisplay = location.attributes[0] ? location.attributes[0].display.split(": ") : null;
                    if (attributeDisplay && attributeDisplay[0] === Bahmni.Registration.Constants.certificateHeader) {
                        locationAddress = attributeDisplay[1];
                    }
                    return registrationCardPrinter.print(option.templateUrl, $scope.patient, calculatePriceByVisitType(), $rootScope.currentUser.username, mapRegistrationObservations(), $scope.encounterDateTime, { "name": location.name, "address": locationAddress });
                };

                $scope.buttonText = function (option, type) {
                    var printHtml = "";
                    var optionValue = option && $filter('titleTranslate')(option);
                    if (type) {
                        printHtml = '<i class="fa fa-print"></i>';
                    }
                    return '<span>' + optionValue + '</span>' + printHtml;
                };
            };

            return {
                restrict: 'A',
                templateUrl: 'views/printOptions.html',
                controller: controller
            };
        }]);
