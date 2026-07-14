'use strict';

angular.module('bahmni.registration')
    .controller('VisitController', ['$window', '$scope', '$rootScope', '$http', '$state', '$bahmniCookieStore', 'patientService', 'encounterService', '$stateParams', 'spinner', '$timeout', '$q', 'appService', 'openmrsPatientMapper', 'contextChangeHandler', 'messagingService', 'sessionService', 'visitService', '$location', '$translate',
        'auditLogService', 'formService',
        function ($window, $scope, $rootScope, $http, $state, $bahmniCookieStore, patientService, encounterService, $stateParams, spinner, $timeout, $q, appService, openmrsPatientMapper, contextChangeHandler, messagingService, sessionService, visitService, $location, $translate, auditLogService, formService) {
            $rootScope.displayNepaliDates = appService.getAppDescriptor().getConfigValue('displayNepaliDates');
            var vm = this;
            var patientUuid = $stateParams.patientUuid;
            var extensions = appService.getAppDescriptor().getExtensions("org.bahmni.registration.conceptSetGroup.observations", "config");
            var formExtensions = appService.getAppDescriptor().getExtensions("org.bahmni.registration.conceptSetGroup.observations", "forms");
            var locationUuid = sessionService.getLoginLocationUuid();
            var selectedProvider = $rootScope.currentProvider;
            var regEncounterTypeUuid = $rootScope.regEncounterConfiguration.encounterTypes[Bahmni.Registration.Constants.registrationEncounterType];
            var visitLocationUuid = $rootScope.visitLocation;
            var redirectToDashboard = false;
            $scope.enableDashboardRedirect = _.some($rootScope.currentUser.privileges, { name: "app:clinical" }) && (appService.getAppDescriptor().getConfigValue("enableDashboardRedirect") || Bahmni.Registration.Constants.enableDashboardRedirect);

            var patientUuid = patientUuid;
            console.log("Patient UUID", patientUuid);

            $http.get(
                "/openmrs/ws/rest/v1/visit?patient=" + patientUuid + "&includeInactive=true&v=custom:(stopDatetime)"
            ).then(function (response) {
                var visits = response.data.results;

                if (visits.length > 1 && visits[1].stopDatetime) {
                    $scope.lastVisitDate = visits[1].stopDatetime;
                    console.log("Last Visit Date (AD)", $scope.lastVisitDate);

                    // Convert lastVisitDate to Nepali date
                    var lastVisitDateParts = $scope.lastVisitDate
                    .split("T")[0]
                    .split("-"); // Extract year, month, day
                    var nepaliDateEng = calendarFunctions.getBsDateByAdDate(
                    parseInt(lastVisitDateParts[0]), // Year
                    parseInt(lastVisitDateParts[1]), // Month
                    parseInt(lastVisitDateParts[2]) // Day
                    );
                    $scope.lastVisitNepaliDate =
                    calendarFunctions.getNepaliNumber(nepaliDateEng.bsYear) +
                    "-" +
                    calendarFunctions.getNepaliNumber(nepaliDateEng.bsMonth) +
                    "-" +
                    calendarFunctions.getNepaliNumber(nepaliDateEng.bsDate);
                    console.log("Last Visit Date (Nepali)", $scope.lastVisitNepaliDate);
                } else {
                    $scope.lastVisitDate = "No visits yet";
                }
            }).catch(function (error) {
                console.error("Error fetching visits:", error);
            });

            var getPatient = function () {
                var deferred = $q.defer();
                patientService.get(patientUuid).then(function (openMRSPatient) {
                    deferred.resolve(openMRSPatient);
                    $scope.patient = openmrsPatientMapper.map(openMRSPatient);
                    $scope.patient.name = openMRSPatient.patient.person.names[0].display;
                    $scope.patient.uuid = openMRSPatient.patient.uuid;
                });
                return deferred.promise;
            };

            var getActiveEncounter = function () {
                var deferred = $q.defer();
                encounterService.find({
                    "patientUuid": patientUuid,
                    "providerUuids": !_.isEmpty($scope.currentProvider.uuid) ? [$scope.currentProvider.uuid] : null,
                    "includeAll": false,
                    locationUuid: locationUuid,
                    encounterTypeUuids: [regEncounterTypeUuid]
                }).then(function (response) {
                    deferred.resolve(response);
                    $scope.encounterUuid = response.data.encounterUuid;
                    $scope.observations = response.data.observations;
                });
                return deferred.promise;
            };

            $scope.updateToEmergency = function () {
                var visitId = 4;
                visitService.changeVisit(visitId, patientUuid).then(function (visitId, patientUuid) {
                    $state.reload();
                });
                toaster.success({
                    title: "EMERGENCY",
                    body: "Changed to ER"
                });
            };

            $scope.updateToOPD = function () {
                var visitId = 5;
                visitService.changeVisit(visitId, patientUuid).then(function (visitId, patientUuid) {
                    $state.reload();
                });
                toaster.success({
                    title: "OPD",
                    body: "Changed to OPD"
                });
            };

            $scope.updateToFollowUp = function () {
                var visitId = 9;
                visitService.changeVisit(visitId, patientUuid).then(function (visitId, patientUuid) {
                    $state.reload();
                });
                toaster.success({
                    title: "FOLLOW UP",
                    body: "Changed to Followup"
                });
            };

            $scope.updateToFree = function () {
                var visitId = 10;
                visitService.changeVisit(visitId, patientUuid).then(function (visitId, patientUuid) {
                    $state.reload();
                });
                toaster.success({
                    title: "FREE VISIT",
                    body: "Changed to Free Visit"
                });
            };

            var getAllForms = function () {
                var deferred = $q.defer();
                formService.getFormList($scope.encounterUuid)
                    .then(function (response) {
                        $scope.conceptSets = extensions.map(function (extension) {
                            return new Bahmni.ConceptSet.ConceptSetSection(extension, $rootScope.currentUser, {}, [], {});
                        });

                        $scope.observationForms = getObservationForms(formExtensions, response.data);
                        $scope.conceptSets = $scope.conceptSets.concat($scope.observationForms);

                        $scope.availableConceptSets = $scope.conceptSets.filter(function (conceptSet) {
                            return conceptSet.isAvailable($scope.context);
                        });
                        deferred.resolve(response.data);
                    });
                return deferred.promise;
            };

            $scope.hideFields = appService.getAppDescriptor().getConfigValue("hideFields");

            $scope.back = function () {
                $state.go('patient.edit');
            };

            $scope.updatePatientImage = function (image) {
                var updateImagePromise = patientService.updateImage($scope.patient.uuid, image.replace("data:image/jpeg;base64,", ""));
                spinner.forPromise(updateImagePromise);
                return updateImagePromise;
            };

            var save = function () {
                $scope.encounter = {
                    patientUuid: $scope.patient.uuid,
                    locationUuid: locationUuid,
                    encounterTypeUuid: regEncounterTypeUuid,
                    orders: [],
                    drugOrders: [],
                    extensions: {}
                };

                $bahmniCookieStore.put(Bahmni.Common.Constants.grantProviderAccessDataCookieName, selectedProvider, {
                    path: '/',
                    expires: 1
                });

                $scope.encounter.observations = $scope.observations;
                $scope.encounter.observations = new Bahmni.Common.Domain.ObservationFilter().filter($scope.encounter.observations);

                addFormObservations($scope.encounter.observations);

                var createPromise = encounterService.create($scope.encounter);
                spinner.forPromise(createPromise);
                return createPromise.then(function (response) {
                    var messageParams = { encounterUuid: response.data.encounterUuid, encounterType: response.data.encounterType };
                    auditLogService.log(patientUuid, 'EDIT_ENCOUNTER', messageParams, 'MODULE_LABEL_REGISTRATION_KEY');
                    var visitType, visitTypeUuid;
                    visitTypeUuid = response.data.visitTypeUuid;
                    visitService.getVisitType().then(function (response) {
                        visitType = _.find(response.data.results, function (type) {
                            if (type.uuid === visitTypeUuid) {
                                return type;
                            }
                        });
                    });
                });
            };

            var isUserPrivilegedToCloseVisit = function () {
                var applicablePrivs = [Bahmni.Common.Constants.closeVisitPrivilege, Bahmni.Common.Constants.deleteVisitsPrivilege];
                var userPrivs = _.map($rootScope.currentUser.privileges, function (privilege) {
                    return privilege.name;
                });
                return _.some(userPrivs, function (privName) {
                    return _.includes(applicablePrivs, privName);
                });
            };

            var searchActiveVisitsPromise = function () {
                return visitService.search({
                    patient: patientUuid, includeInactive: false, v: "custom:(uuid,location:(uuid))"
                }).then(function (response) {
                    var results = response.data.results;
                    var activeVisitForCurrentLoginLocation;
                    if (results) {
                        activeVisitForCurrentLoginLocation = _.filter(results, function (result) {
                            return result.location.uuid === visitLocationUuid;
                        });
                    }

                    var hasActiveVisit = activeVisitForCurrentLoginLocation.length > 0;
                    vm.visitUuid = hasActiveVisit ? activeVisitForCurrentLoginLocation[0].uuid : "";
                    $scope.canCloseVisit = isUserPrivilegedToCloseVisit() && hasActiveVisit;
                });
            };

            $scope.closeVisitIfDischarged = function () {
                visitService.getVisitSummary(vm.visitUuid).then(function (response) {
                    var visitSummary = response.data;
                    if (visitSummary.admissionDetails && !visitSummary.dischargeDetails) {
                        messagingService.showMessage("error", 'REGISTRATION_VISIT_CANNOT_BE_CLOSED');
                        var messageParams = { visitUuid: vm.visitUuid, visitType: visitSummary.visitType };
                        auditLogService.log(patientUuid, 'CLOSE_VISIT_FAILED', messageParams, 'MODULE_LABEL_REGISTRATION_KEY');
                    } else {
                        closeVisit(visitSummary.visitType);
                    }
                });
            };

            var closeVisit = function (visitType) {
                var confirmed = $window.confirm($translate.instant("REGISTRATION_CONFIRM_CLOSE_VISIT"));
                if (confirmed) {
                    visitService.endVisit(vm.visitUuid).then(function () {
                        $location.url(Bahmni.Registration.Constants.patientSearchURL);
                        var messageParams = { visitUuid: vm.visitUuid, visitType: visitType };
                        auditLogService.log(patientUuid, 'CLOSE_VISIT', messageParams, 'MODULE_LABEL_REGISTRATION_KEY');
                    });
                }
            };
            $scope.getTranslatedPrimaryIdentifierInVisit = function (primaryIdentifierName) {
                var translatedName = Bahmni.Common.Util.TranslationUtil.translateAttribute(primaryIdentifierName, Bahmni.Common.Constants.registration, $translate);
                return translatedName;
            };
            $scope.getMessage = function () {
                return $scope.message;
            };

            var isObservationFormValid = function () {
                var valid = true;
                _.each($scope.observationForms, function (observationForm) {
                    if (valid && observationForm.component) {
                        var value = observationForm.component.getValue();
                        if (value.errors) {
                            messagingService.showMessage('error', "{{'REGISTRATION_FORM_ERRORS_MESSAGE_KEY' | translate }}");
                            valid = false;
                        }
                    }
                });
                return valid;
            };

            var validate = function () {
                var isFormValidated = mandatoryValidate();
                var deferred = $q.defer();
                var contxChange = contextChangeHandler.execute();
                var allowContextChange = contxChange["allow"];
                var errorMessage;
                if (!isObservationFormValid()) {
                    deferred.reject("Some fields are not valid");
                    return deferred.promise;
                }
                if (!allowContextChange) {
                    errorMessage = contxChange["errorMessage"] ? contxChange["errorMessage"] : 'REGISTRATION_LABEL_CORRECT_ERRORS';
                    messagingService.showMessage('error', errorMessage);
                    deferred.reject("Some fields are not valid");
                    return deferred.promise;
                } else if (!isFormValidated) { // This ELSE IF condition is to be deleted later.
                    errorMessage = "REGISTRATION_LABEL_ENTER_MANDATORY_FIELDS";
                    messagingService.showMessage('error', errorMessage);
                    deferred.reject("Some fields are not valid");
                    return deferred.promise;
                } else {
                    deferred.resolve();
                    return deferred.promise;
                }
            };

            // Start :: Registration Page validation
            // To be deleted later - Hacky fix only for Registration Page
            var mandatoryConceptGroup = [];
            var mandatoryValidate = function () {
                conceptGroupValidation($scope.observations);
                return isValid(mandatoryConceptGroup);
            };

            var conceptGroupValidation = function (observations) {
                var concepts = _.filter(observations, function (observationNode) {
                    return isMandatoryConcept(observationNode);
                });
                if (!_.isEmpty(concepts)) {
                    mandatoryConceptGroup = _.union(mandatoryConceptGroup, concepts);
                }
            };
            var isMandatoryConcept = function (observation) {
                if (!_.isEmpty(observation.groupMembers)) {
                    conceptGroupValidation(observation.groupMembers);
                } else {
                    return observation.conceptUIConfig && observation.conceptUIConfig.required;
                }
            };
            var isValid = function (mandatoryConcepts) {
                var concept = mandatoryConcepts.filter(function (mandatoryConcept) {
                    if (mandatoryConcept.hasValue()) {
                        return false;
                    }
                    if (mandatoryConcept instanceof Bahmni.ConceptSet.Observation &&
                        mandatoryConcept.conceptUIConfig && mandatoryConcept.conceptUIConfig.multiSelect) {
                        return false;
                    }
                    if (mandatoryConcept.isMultiSelect) {
                        return _.isEmpty(mandatoryConcept.getValues());
                    }
                    return !mandatoryConcept.value;
                });
                return _.isEmpty(concept);
            };
            // End :: Registration Page validation

            var afterSave = function () {
                var forwardUrl = appService.getAppDescriptor().getConfigValue("afterVisitSaveForwardUrl");
                var dashboardUrl = appService.getAppDescriptor().getConfigValue("dashboardUrl") || Bahmni.Registration.Constants.dashboardUrl;
                if (forwardUrl != null) {
                    $window.location.href = appService.getAppDescriptor().formatUrl(forwardUrl, { 'patientUuid': patientUuid });
                } else if (dashboardUrl != null && redirectToDashboard) {
                    $window.location.href = appService.getAppDescriptor().formatUrl(dashboardUrl, { 'patientUuid': patientUuid });
                } else {
                    $state.transitionTo($state.current, $state.params, {
                        reload: true,
                        inherit: false,
                        notify: true
                    });
                }
                messagingService.showMessage('info', 'REGISTRATION_LABEL_SAVED');

                try {
                    var visitFeeFor = "";
                    var visitUuid = vm.visitUuid;
                    console.log("Visit Uuid", visitUuid);
                    var visitFee = 0;
                    var isFollowUp = 0;
                    var departmentSent = "";
                    console.log("Encounter Observations", $scope.encounter.observations);
                    for (var i = 0; i < $scope.encounter.observations.length; i++) {
                        // Check if Fee Information Concept UUID exists
                        if ($scope.encounter.observations[i]["concept"]["uuid"] == "c446af3d-3f10-11e4-adec-0800271c1b75") {
                            for (var j = 0; j < $scope.encounter.observations[i].groupMembers.length; j++) {
                                // Check if Ticket Fee Concept UUID exists
                                if ($scope.encounter.observations[i].groupMembers[j]["concept"]["uuid"] == "128789de-5293-4c67-918e-28ac7c7ea3dd") {
                                    visitFeeFor = $scope.encounter.observations[i].groupMembers[j]["value"]["displayString"];
                                    console.log("Visit Fee For", visitFeeFor);
                                }
                            }
                        }
                    }
                    switch (visitFeeFor.toLowerCase()) {
                    case "opd ticket":
                        visitFee = 30;
                        break;
                    case "er ticket":
                        visitFee = 50;
                        break;
                    case "ehs ticket":
                        visitFee = 300;
                        break;
                    case "followup ticket":
                        visitFee = 15;
                        break;
                    case "free followup ticket":
                        visitFee = 0;
                        break;
                    case "opd followup":
                        visitFee = 0;
                        break;
                    case "opd followup eye":
                        visitFee = 0;
                        break;
                    case "opd followup dental":
                        visitFee = 0;
                        break;
                    case "other visit":
                        visitFee = 0;
                        break;
                    case "opd ticket anc":
                        visitFee = 0;
                        break;
                    case "opd follow up anc":
                        visitFee = 0;
                        break;
                    case "opd ticket immunization":
                        visitFee = 0;
                        break;
                    case "opd ocmc":
                        visitFee = 0;
                        break;
                    case "dialysis registration":
                        visitFee = 0;
                        break;
                    case "art registration":
                        visitFee = 0;
                        break;
                    case "emergency ssu":
                        visitFee = 0;
                        break;
                    case "opd ssu":
                        visitFee = 0;
                        break;
                    case "free ticket":
                        visitFee == 0;
                        break;
                    case "family planning registration":
                        visitFee = 0;
                        break;
                    case "poor":
                        visitFee = 0;
                        break;
                    case "disable":
                        visitFee = 0;
                        break;
                    case "senior citizen":
                        visitFee = 0;
                        break;
                    case "below 10":
                        visitFee = 0;
                        break;
                    case "above 60":
                        visitFee = 0;
                        break;
                    case "fchb":
                        visitFee = 0;
                        break;
                    case "copayment":
                        visitFee = 5;
                        break;
                    case "insurance followup ticket":
                        visitFee = 0;
                        break;
                    default:
                        visitFee = 0;
                    }
                    $scope.visitTypePrice = "Rs " + visitFee;
                    console.log("Visit Type Price", $scope.visitTypePrice);

                    var visitUpdateUrl = "/openmrs/ws/rest/v1/bahmnicore/sql?fee=" + visitFee + "&followup=" + isFollowUp + "&visitUuid=" + visitUuid + "&dept=" + departmentSent + "&subdept=" + departmentSent + "&provider=RAM&q=emrapi.sqlGet.updateVisitFee&v=full";
                    updateVisitFee(visitUpdateUrl);
                }
                catch (err) {
                    console.log("" + err);
                }
            };

            $scope.submit = function () {
                return validate().then(save).then(afterSave);
            };

            $scope.today = function () {
                return new Date();
            };

            $scope.disableFormSubmitOnEnter = function () {
                $('.visit-patient').find('input').keypress(function (e) {
                    if (e.which === 13) { // Enter key = keycode 13
                        return false;
                    }
                });
            };

            var updateVisitFee = function (theUrl) {
                try {
                    var xmlhttp = new XMLHttpRequest();
                    xmlhttp.open("GET", theUrl);
                    xmlhttp.setRequestHeader(
                        "Content-Type",
                        "application/json;charset=UTF-8"
                    );
                    xmlhttp.onload = function (e) {
                        if (xmlhttp.status == 200) {
                        }
                    };
                    xmlhttp.send();
                } catch (err) {
                    alert("" + err);
                }
            };

            var getConceptSet = function () {
                var visitType = $scope.encounterConfig.getVisitTypeByUuid($scope.visitTypeUuid);
                $scope.context = { visitType: visitType, patient: $scope.patient };
            };

            var getObservationForms = function (extensions, observationsForms) {
                var forms = [];
                var observations = $scope.observations || [];
                _.each(extensions, function (ext) {
                    var options = ext.extensionParams || {};
                    var observationForm = _.find(observationsForms, function (form) {
                        return (form.formName === options.formName || form.name === options.formName);
                    });
                    if (observationForm) {
                        var formUuid = observationForm.formUuid || observationForm.uuid;
                        var formName = observationForm.name || observationForm.formName;
                        var formVersion = observationForm.version || observationForm.formVersion;
                        forms.push(new Bahmni.ObservationForm(formUuid, $rootScope.currentUser, formName, formVersion, observations, formName, ext));
                    }
                });
                return forms;
            };

            $scope.isFormTemplate = function (data) {
                return data.formUuid;
            };

            var addFormObservations = function (observations) {
                if ($scope.observationForms) {
                    _.remove(observations, function (observation) {
                        return observation.formNamespace;
                    });
                    _.each($scope.observationForms, function (observationForm) {
                        if (observationForm.component) {
                            var formObservations = observationForm.component.getValue();
                            _.each(formObservations.observations, function (obs) {
                                observations.push(obs);
                            });
                        }
                    });
                }
            };

            $scope.setDashboardRedirect = function () {
                redirectToDashboard = true;
                return validate().then(save).then(afterSave);
            };

            spinner.forPromise($q.all([getPatient(), getActiveEncounter(), searchActiveVisitsPromise()])
                .then(function () {
                    getAllForms().then(function () {
                        getConceptSet();
                    });
                }));
        }]);
