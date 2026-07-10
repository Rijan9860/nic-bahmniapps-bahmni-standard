'use strict';

angular
    .module('bahmni.clinical')
    .directive('doctorInfo', ['$http', '$cookies', function ($http, $cookies) {
        return {
            restrict: 'E',
            scope: false,
            templateUrl: 'displaycontrols/doctorData/views/doctorInfo.html',

            link: function ($scope) {
                var patientUuid = $scope.patientUuid;
                console.log('Patient Uuid:', patientUuid);

                $http
                    .get('/openmrs/ws/rest/v1/visit?patient=' + patientUuid + '&v=full&limit=1&order=desc').then(function (response) {
                        var encounters = response.data.results[0].encounters;
                        var consultation = null;
                        var i;

                        for (i = 0; i < encounters.length; i++) {
                            if (encounters[i].encounterType.display === 'Consultation') {
                                consultation = encounters[i];
                                break;
                            }
                        }

                        if (consultation && consultation.encounterProviders.length > 0) {
                            var providers = encounters[0].encounterProviders[0].display;
                            console.log('Provider:', providers);

                            var fullName = 'N/A';
                            var nmcNumber = 'N/A';

                            if (providers.indexOf(':') !== -1) {
                                var parts = providers.split(':');
                                console.log('Parts', parts);

                                if (parts[0].indexOf('_') !== -1) {
                                    var separate = parts[0].split('_');
                                    console.log('Separate', separate);

                                    fullName = separate[0];
                                    nmcNumber = separate[1];
                                } else {
                                    fullName = parts[0];
                                }
                            }

                            $scope.fullName = fullName;
                            $scope.nmcNumber = nmcNumber;

                            console.log('FullName:', fullName);
                            console.log('Nmc Number:', nmcNumber);
                        } else {
                            console.log('Invalid Encounter Providers.');
                        }
                    });

                // Consultant section
                $scope.consultants = [];
                $scope.selectedConsultant = null;
                $scope.consultantName = '';
                $scope.consultantNmc = 'N/A';

                // Load providers
                $http
                    .get('/openmrs/ws/rest/v1/provider?v=full')
                    .then(function (response) {
                        $scope.consultants = response.data.results.map(function (p) {
                            var attr = p.attributes.find(function (a) {
                                return a.attributeType.display === 'NMC Number';
                            });

                            var nmcAttr = attr ? attr.value : null;

                            return {
                                name: p.person.display + (nmcAttr ? '_' + nmcAttr : ''),
                                nmc: nmcAttr || 'N/A'
                            };
                        });

                        // Load previously selected consultant from cookies
                        var saved = $cookies.getObject('selectedConsultant');

                        if (saved) {
                            $scope.selectedConsultant = saved;
                            updateConsultantFields(saved);
                        }
                    });

                // Watch for consultant selection
                $scope.$watch('selectedConsultant', function (newValue) {
                    if (newValue) {
                        $cookies.putObject('selectedConsultant', newValue);
                        updateConsultantFields(newValue);
                    }
                });

                function updateConsultantFields (consultant) {
                    if (!consultant) {
                        return;
                    }

                    if (consultant.name.indexOf('_') !== -1) {
                        var parts = consultant.name.split('_');
                        $scope.consultantName = parts[0];
                        $scope.consultantNmc = parts[1];
                    } else {
                        $scope.consultantName = consultant.name;
                        $scope.consultantNmc = consultant.nmc || 'N/A';
                    }
                }
            }
        };
    }]);
