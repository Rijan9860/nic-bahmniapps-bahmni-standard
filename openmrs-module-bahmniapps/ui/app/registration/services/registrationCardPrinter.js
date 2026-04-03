'use strict';

angular.module('bahmni.registration')
    .factory('registrationCardPrinter', ['printer', function (printer) {
        var print = function (templatePath, patient, visitTypePrice, user, obs, encounterDateTime, location) {
            templatePath = templatePath || "views/nolayoutfound.html";
            printer.print(templatePath, {patient: patient, today: new Date(), visitTypePrice: visitTypePrice, user: user, obs: obs || {}, encounterDateTime: encounterDateTime, location: location });
        };

        return {
            print: print
        };
    }]);
