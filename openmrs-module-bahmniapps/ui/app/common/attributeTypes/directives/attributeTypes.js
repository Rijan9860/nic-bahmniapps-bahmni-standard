'use strict';

angular.module('bahmni.common.attributeTypes', []).directive('attributeTypes', [function () {
    return {
        scope: {
            targetModel: '=',
            attribute: '=',
            fieldValidation: '=',
            isAutoComplete: '&',
            getAutoCompleteList: '&',
            getDataResults: '&',
            handleUpdate: '&',
            isReadOnly: '&',
            isForm: '=?'
        },
        templateUrl: '../common/attributeTypes/views/attributeInformation.html',
        restrict: 'E',
        controller: function ($scope, $translate, $location, $http) {
            $scope.getAutoCompleteList = $scope.getAutoCompleteList();
            $scope.getDataResults = $scope.getDataResults();
            // to avoid watchers in one way binding
            $scope.isAutoComplete = $scope.isAutoComplete() || function () { return false; };
            $scope.isReadOnly = $scope.isReadOnly() || function () { return false; };
            $scope.handleUpdate = $scope.handleUpdate() || function () { return false; };

            $scope.appendConceptNameToModel = function (attribute) {
                var attributeValueConceptType = $scope.targetModel[attribute.name];
                var concept = _.find(attribute.answers, function (answer) {
                    return answer.conceptId === attributeValueConceptType.conceptUuid;
                });
                attributeValueConceptType.value = concept && concept.fullySpecifiedName;
            };
            $scope.getTranslatedAttributeTypes = function (attribute) {
                var translatedName = Bahmni.Common.Util.TranslationUtil.translateAttribute(attribute, Bahmni.Common.Constants.patientAttribute, $translate);
                return translatedName;
            };
            $scope.checkNHISNumber = function (attribute) {
                console.log("Check NHIS Number");
                var nhisNumber = $scope.targetModel["NHIS Number"];
                document.getElementById("hibNo").innerHTML = nhisNumber;
                var linkedurl = "https://imis.hib.gov.np/InsureeProfile.aspx?nshid=" + nhisNumber;
                document.getElementById("linktoHMIS").href = linkedurl;
                document.getElementById("hibEligibilityDialog").classList.toggle("hideDialogEl");
                var url = "https://192.168.56.101:4433/insurance/Eligibility.php?identifier=" + nhisNumber;
                $http.get(url).then(function (response) {
                    var data = response.data;
                    var patientInfo = JSON.parse(data.info);
                    console.log("Patient Information", patientInfo);
                    var eligibility = JSON.parse(data.eligibility);
                    console.log("Eligibility", eligibility);
                    var firstName = patientInfo.entry[0].resource.name[0].given[0];
                    var middleName = "";
                    if (firstName.split(" ").length > 1) {
                        firstName = firstName.split(" ")[0];
                        middleName = firstName.split(" ")[1];
                    }
                    var imageUrl = eligibility.extension[0].valueString;
                    var familyName = patientInfo.entry[0].resource.name[0].family;
                    var contact = patientInfo.entry[0].resource.telecom[0].value;
                    var gender = patientInfo.entry[0].resource.gender;
                    var birthDate = patientInfo.entry[0].resource.birthDate;
                    const fullBirthDate = new Date(birthDate);
                    const currentDate = new Date();
                    const ageInMilliseconds = currentDate - fullBirthDate;
                    const ageInYears = ageInMilliseconds / (1000 * 60 * 60 * 24 * 365.25);
                    var age = Math.floor(ageInYears);
                    var categoryMed = "";
                    var categoryOpd = "";
                    var totalMoneyMed = "";
                    var totalMoneyOpd = "";
                    var usedMoneyMed = "";
                    var usedMoneyOpd = "";
                    var copaymentValue = eligibility.insurance[0].extension[0].valueDecimal;
                    var isCopayment = "";
                    if (copaymentValue > 0) {
                        isCopayment = "yes";
                    }
                    else {
                        isCopayment = "no";
                    }
                    for (var i = 0; i < eligibility.insurance[0].benefitBalance.length; i++) {
                        var elig = eligibility.insurance[0].benefitBalance[i];
                        if (elig.category.text == "medical") {
                            categoryMed = elig.category.text;
                            totalMoneyMed = parseFloat(elig.financial[0].allowedMoney.value);
                            usedMoneyMed = parseFloat(elig.financial[0].usedMoney.value);
                        }
                        else if (elig.category.text == "opd") {
                            categoryOpd = elig.category.text;
                            totalMoneyOpd = parseFloat(elig.financial[0].allowedMoney.value);
                            usedMoneyOpd = parseFloat(elig.financial[0].usedMoney.value);
                        }
                    }
                    if (imageUrl != null) {
                        document.getElementById("hibImage").src = imageUrl;
                    }
                    document.getElementById("hibName").innerHTML = firstName + " " + middleName + " " + familyName;
                    document.getElementById("hibContact").innerHTML = contact;
                    document.getElementById("hibGender").innerHTML = gender;
                    document.getElementById("hibDob").innerText = birthDate + " (" + age + "Y" + ")";
                    document.getElementById("hibCategory-med").innerHTML = categoryMed;
                    document.getElementById("hibCategory-opd").innerHTML = categoryOpd;
                    document.getElementById("hibAllowed-med").innerHTML = totalMoneyMed;
                    document.getElementById("hibAllowed-opd").innerHTML = totalMoneyOpd;
                    document.getElementById("hibUsed-med").innerHTML = usedMoneyMed;
                    document.getElementById("hibUsed-opd").innerHTML = usedMoneyOpd;
                    document.getElementById("hibCopayment").innerHTML = isCopayment;
                    if (totalMoneyMed - usedMoneyMed > 50 || totalMoneyOpd - usedMoneyOpd > 50) {
                        document.getElementById("Is NHIS Active").checked = true;
                    }
                    else {
                        document.getElementById("Is NHIS Active").checked = false;
                    }
                }).catch(function (error) {
                    alert("" + error.status);
                });
            };
            $scope.generateClaimCode = function () {
                console.log("Generate Claim Code");
                var url = "https://192.168.56.101:4433/insurance/getClaimCode.php";
                $http.get(url).then(function (response) {
                    var claimCode = response.data;
                    console.log("Claim Code", claimCode);
                    document.getElementById("Claim Code").value = claimCode;
                }).catch(function (error) {
                    alert("" + error.status);
                });
            };
            $scope.generateIpdNumber = function () {
                console.log("Generate Ipd Number");
                var url = "https://192.168.56.101:4433/insurance/getIpdNumber.php";
                $http.get(url).then(function (response) {
                    var ipdNumber = response.data;
                    console.log("IPD Number", ipdNumber);
                    document.getElementById("IPD Number").value = ipdNumber;
                }).catch(function (error) {
                    alert("" + error.status);
                });
            };
        }
    };
}]);
