'use strict';

angular.module('bahmni.common.uiHelper')
    .directive('npdatepicker', ['$timeout', function ($timeout) {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function ($scope, element, attrs) {
                $timeout(function () {
                    var currentDate = new Date();
                    var currentNepaliDate = calendarFunctions.getBsDateByAdDate(
                        currentDate.getFullYear(),
                        currentDate.getMonth() + 1,
                        currentDate.getDate()
                    );
                    var formattedNepaliDate = calendarFunctions.bsDateFormat(
                        "%y-%m-%d",
                        currentNepaliDate.bsYear,
                        currentNepaliDate.bsMonth,
                        currentNepaliDate.bsDate
                    );
                    var allowFuture = attrs.allowFutureDates === "true";
                    element.nepaliDatePicker({
                        dateFormat: "%y-%m-%d",
                        closeOnDateSelect: true,
                        minDate: attrs.min || null,
                        maxDate: allowFuture ? null : formattedNepaliDate
                    });
                }, 400);
                element.on('dateSelect', function (event) {
                    element.trigger('input');
                });
            }
        };
    }]);
