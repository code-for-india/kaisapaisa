var constants = {

     CHICKEN_SELLING_PRICE: 500
    ,CHICKEN_ANNUAL_EXPENSE: 150
    ,CHICKEN_ANNUAL_INCOME: 350

    ,GOAT_SELLING_PRICE: 15000
    ,GOAT_ANNUAL_EXPENSE: 8000
    ,GOAT_ANNUAL_INCOME: 30000

    ,COW_SELLING_PRICE: 85000
    ,COW_ANNUAL_EXPENSE: 20000
    ,COW_ANNUAL_INCOME: 50000

    ,LAND_SELLING_PRICE: 120000
    ,LAND_ANNUAL_RENT_INCOME: 20000
    ,LAND_ANNUAL_AGRICULTURE_INCOME: 80000

    ,TRACTOR_SELLING_PRICE: 70000
    ,TRACTOR_ANNUAL_RENT_INCOME: 20000
    ,TRACTOR_ANNUAL_AGRICULTURE_INCOME: 35000

    ,INITIAL_CASH: 100000
    ,ANNUAL_FAMILY_EXPENSE: 40000
    ,ANNUAL_CHILD_EXPENSE: 10000
    ,ANNUAL_COLLEGE_EXPENSE: 120000

};

var Game = {

    level: 1
   ,init: function() {
        var self = this;
        $('.btn-level').click(function() {
           self.start($(this).attr('rel'));
        })
    }
   ,start: function(level) {

      var self = this;
      self.level = parseInt(level);
      $.extend(self, self.createGameBoard());

      self.renderUI();
      console.log(self);

      console.log(self.getFinancialState());
      $('#LevelInfo').fadeOut();
      $('#GameInfo').fadeOut();
      $('#GameDetail').fadeIn();

   }

   ,stop: function() {

        $('#LevelInfo').fadeIn();
        $('#GameInfo').fadeIn();
        $('#GameDetail').fadeOut();
   }

   ,refreshPiggyBankUI: function() {

        var self = this;

        if ($('#PiggyBankAmount').attr('disabled') === 'disabled') return;

        $('#PiggyBankAmount').html('');
        for(var i=0;i<=self.cash;i+=10000) {
            $('#PiggyBankAmount').append('<option value="' + i + '">Rs. ' + formatRupees(i) + '</option>');
        }

        $('#PiggyBankAmount').change(function(){

            if ($('#PiggyBankAmount').attr('disabled') === 'disabled') return;
            if ($(this).hasClass('paused')) return;
            var amount = parseInt($(this).val());
            if (confirm('Are you sure you want to put Rs. ' + formatRupees(amount) + ' into the Piggy Bank? Once you put this money in, you cannot get it out during the game.'))
            {
                self.depositToPiggyBank(amount);
                $(this).attr('disabled', 'disabled').css('color','green');
                $('#BankAmount').addClass('paused');
                self.refreshBankUI(false);
                $('#BankAmount').removeClass('paused');

            }

        });

    }

    ,refreshBankUI: function() {


        var self = this;

        if ($('#BankAmount').attr('disabled') === 'disabled') return;

        $('#BankAmount').html('');
        for(var i=0;i<=self.cash;i+=10000) {
            $('#BankAmount').append('<option value="' + i + '">Rs. ' + formatRupees(i) + '</option>');
        }

        $('#BankAmount').change(function(){

            if ($(this).hasClass('paused')) return;
            if ($('#BankAmount').attr('disabled') === 'disabled') return;

            var amount = parseInt($(this).val());
            if (confirm('Are you sure you want to put Rs. ' + formatRupees(amount) + ' into the Bank? Once you put this money in, you cannot get it out during the game.'))
            {
                self.depositToBank(amount);
                $(this).attr('disabled', 'disabled').css('color','green');

                $('#PiggyBankAmount').addClass('paused');
                self.refreshPiggyBankUI();
                $('#PiggyBankAmount').removeClass('paused');
            }

        });
    }
   ,renderUI: function() {
        var self = this;

        var financialInfo = self.getFinancialState();

        $('#CashSavings').text(formatRupees(self.initialCash));
        $('#PropertyValue').text(formatRupees(financialInfo.assets.thingValue));
        $('#PropertyIncome').text(formatRupees(financialInfo.incomes.thingIncome/self.period));

        $('#LivestockValue').text(formatRupees(financialInfo.assets.animalValue));
        $('#LivestockIncome').text(formatRupees(financialInfo.incomes.animalIncome/self.period));

        for(var c=0;c<self.children.length;c++) {
            $('#Children').append('<img src="assets/images/' + (self.children[c].gender == 'f' ? 'girl' : 'boy') + '.jpg" style="width:150px;margin-right:5px;margin-top:5px;" />');
        }

        $('#HouseholdCash').text(formatRupees(financialInfo.expenses.householdExpense/self.period));
        if (financialInfo.info.collegeCount == 0) {
            $('#CollegeBlurb').hide();
        }
        else
        {
            $('#CollegeCash').text(formatRupees(financialInfo.goals.collegeExpense/self.period));
            $('#CollegeCount').text(formatRupees(financialInfo.info.collegeCount));
        }

        self.refreshPiggyBankUI();

        $('#BankRate').append(self.bankInterestRate + '%');
        self.refreshBankUI();

        // Livestock
        for(var l=0;l<self.animals.length;l++)
        {
            var animal = self.animals[l];
            var html = '<div class="row-fluid" style="margin-bottom:20px;">';
            html += '<div class="span5">';
            html += '<img src="assets/images/' + animal.id + '.jpg" style="width:100%;border:4px ridge #57a8a5;border-radius:30px;" />';
            html += '</div>';
            html += '<div class="span4">';

            html += '<h3>' + animal.name + '</h3>';

            for(var p=0;p<self.period;p++) {
                html += '<div class="Livestock">';
                html += '<span id="Livestock-Label-' + l + '-' + p + '" style="margin-right:20px;font-size:16px;">YEAR ' + (p+1) + ':</span>';
                html += '<select id="Livestock-Selector-' + l + '-' + p + '">' +
                    '<option value="keep">Earn Rs.' + formatRupees(animal.annualIncome) + ' for ' + animal.outputPlural + '</option>' +
                    '<option value="sell">Sell for Rs.' + formatRupees(animal.sellingPrice) + '</option>' +
                    '</select>';
                html += '</div>'

            }

            html += '</div><div class="span3" id="Livestock-Info-' + l + '" style="font-size:1.3em;"></div>';

            $('#LivestockSectionContent').append(html);

            $('.Livestock select').change(function() {
                var id = $(this).attr('id').split('-');
                var index = parseInt(id[2]);
                var year = parseInt(id[3]);

                if ($(this).val() == 'sell')
                {
                   self.sellAnimal(index,year);
                   for(var x=year+1;x<self.period;x++) {
                       $('#Livestock-Selector-' + index + '-' + x).hide().val('sell');
                       $('#Livestock-Label-' + index + '-' + x).hide();
                   }

                }
                else
                {
                    self.unsellAnimal(index,year);
                    for(var x=year+1;x<self.period;x++) {
                        if ($('#Livestock-Selector-' + index + '-' + x).val() != 'sell') {

                            $('#Livestock-Selector-' + index + '-' + x).show();
                            $('#Livestock-Label-' + index + '-' + x).show();

                        }
                    }

                }

                self.showAnimalInfo(index);

            });

            self.showAnimalInfo(l);
        }

        // Property
        for(var l=0;l<self.things.length;l++)
        {
            var thing = self.things[l];
            var html = '<div class="row-fluid" style="margin-bottom:20px;">';
            html += '<div class="span5">';
            html += '<img src="assets/images/' + thing.id + '.jpg" style="width:100%;border:4px ridge #57a8a5;border-radius:30px;" />';
            html += '</div>';
            html += '<div class="span4">';

            html += '<h3>' + thing.name + '</h3>';

            for(var p=0;p<self.period;p++) {
                html += '<div class="Property">';
                html += '<span id="Property-Label-' + l + '-' + p + '" style="margin-right:20px;font-size:16px;">YEAR ' + (p+1) + ':</span>';

                html += '<select id="Property-Selector-' + l + '-' + p + '">' +
                    '<option value="using">Earn Rs.' + formatRupees(self.dryWeather[p] ? Math.round(thing.annualAgricultureIncome * 0.8) : thing.annualAgricultureIncome) + ' for agriculture use</option>' +
                    '<option value="rented">Rent for Rs.' + formatRupees(thing.annualRentIncome) + '</option>' +
                    '<option value="sold">Sell for Rs.' + formatRupees(thing.sellingPrice) + '</option>' +
                    '</select>';
                html += self.dryWeather[p] ? ' <span style="color:red">[DRY]</span>' : '';
                html += '</div>'

            }

            html += '</div><div class="span3" id="Property-Info-' + l + '" style="font-size:1.3em;"></div>';

            $('#PropertySectionContent').append(html);

            $('.Property select').change(function() {
                var id = $(this).attr('id').split('-');
                var index = parseInt(id[2]);
                var year = parseInt(id[3]);

                if ($(this).val() == 'sold')
                {
                    self.sellThing(index,year);
                    for(var x=year+1;x<self.period;x++) {
                        $('#Property-Selector-' + index + '-' + x).hide().val('sold');
                        $('#Property-Label-' + index + '-' + x).hide();
                    }

                }
                else if($(this).val() == 'rented')
                {
                    self.rentThing(index,year);
                    for(var x=year+1;x<self.period;x++) {
                        if ($('#Property-Selector-' + index + '-' + x).val() != 'sold') {

                            $('#Property-Selector-' + index + '-' + x).show();
                            $('#Property-Label-' + index + '-' + x).show();

                        }
                    }

                }
                else
                {
                    self.resetThing(index,year);
                    for(var x=year+1;x<self.period;x++) {
                        if ($('#Property-Selector-' + index + '-' + x).val() != 'sold') {

                            $('#Property-Selector-' + index + '-' + x).show();
                            $('#Property-Label-' + index + '-' + x).show();

                        }
                    }

                }
                self.showThingInfo(index);

            });

            self.showThingInfo(l);
        }

   }

   ,showAnimalInfo: function(index) {
        var self = this;
        var income = 0;
        var expense = 0;
        var saleMoney = 0;

        for(var w=0;w<self.period;w++) {
            if (self.animals[index].sold[w]) {
                saleMoney = self.animals[index].sellingPrice;
                break;
            }
            else
            {
                income += self.animals[index].annualIncome;
                expense += self.animals[index].annualExpense;
            }

        }
        var total =  income - expense + saleMoney;
        $('#Livestock-Info-' + index).html('<h3>Money</h3>' +
            (income > 0 ? '<div style="color:green;"><i class="icon-dark icon-plus-sign"></i> Earnings: Rs.' + formatRupees(income) + '</div>' : '') +
            (expense > 0 ? '<div style="color:red;"><i class="icon-dark icon-minus-sign"></i> Expenses: Rs.' + formatRupees(expense) + '</div>' : '') +
            (saleMoney > 0 ? '<div style="color:green;"><i class="icon-dark icon-plus-sign"></i> Sale Amount: Rs.' + formatRupees(saleMoney) + '</div>' : '') +
            '<div style="margin-top: 20px;"><i class="icon-dark icon-money"></i> <b>Total: Rs.' + formatRupees(total) + '</b></div>');
    }

    ,showThingInfo: function(index) {
        var self = this;
        var income = 0;

        var saleMoney = 0;

        for(var w=0;w<self.period;w++) {
            if (self.things[index].status[w] === 'sold') {
                saleMoney = self.things[index].sellingPrice;
                break;
            }
            else if (self.things[index].status[w] === 'rented')
            {
                income += self.things[index].annualRentIncome;
            }
            else
            {
                income += self.dryWeather[w] ? Math.round(self.things[index].annualAgricultureIncome * 0.8) : self.things[index].annualAgricultureIncome;
            }

        }
        var total =  income + saleMoney;
        $('#Property-Info-' + index).html('<h3>Money</h3>' +
            (income > 0 ? '<div style="color:green;"><i class="icon-dark icon-plus-sign"></i> Earnings: Rs.' + formatRupees(income) + '</div>' : '') +
            (saleMoney > 0 ? '<div style="color:green;"><i class="icon-dark icon-plus-sign"></i> Sale Amount: Rs.' + formatRupees(saleMoney) + '</div>' : '') +
            '<div style="margin-top: 20px;"><i class="icon-dark icon-money"></i> <b>Total: Rs.' + formatRupees(total) + '</b></div>');
    }
   ,getFinancialState: function() {
        var self = this;

        var animalIncome = 0;
        var animalExpense = 0;
        var animalValue = 0;

        var thingIncome = 0;
        var thingValue = 0;

        for(var i=0;i<self.animals.length;i++)
        {
            for(var p=0;p<self.period;p++)
            {
                if (self.animals[i].sold[p]){
                    animalIncome += self.animals[i].sellingPrice;
                    break;
                }
                else
                {
                    animalIncome += self.animals[i].annualIncome;
                    animalExpense += self.animals[i].annualExpense;
                }
            }

            animalValue += self.animals[i].sellingPrice;
        }

        for(var i=0;i<self.things.length;i++)
        {
            for(var p=0;p<self.period;p++)
            {
                if (self.things[i].status[p] === 'sold'){
                    thingIncome += self.things[i].sellingPrice;
                    break;
                }
                else if (self.things[i].status[p] === 'rented'){

                    thingIncome += self.things[i].annualRentIncome;
                }
                else {
                    thingIncome += self.dryWeather[p] ? Math.round(self.things[i].annualAgricultureIncome * 0.8) : self.things[i].annualAgricultureIncome;
                }
            }
            thingValue += self.things[i].sellingPrice;
        }

        var householdExpense = 0;
        for(var p=0;p<self.period;p++)
        {
            householdExpense += constants.ANNUAL_FAMILY_EXPENSE + (self.children.length * constants.ANNUAL_CHILD_EXPENSE);
        }

        var collegeExpense = 0;
        var collegeKidCount = 0;
        for(var c=0;c<self.children.length;c++)
        {
            if (self.children[c].college)
            {
                collegeKidCount++;
                collegeExpense += (constants.ANNUAL_COLLEGE_EXPENSE * self.period);
            }
        }

        var financialInfo =  {
             assets: {
                 cash: self.cash
                ,bankAmount: self.bankAmount
                ,piggyBankAmount: self.piggyBankAmount
                ,animalValue: animalValue
                ,thingValue: thingValue
             }
            ,incomes: {
                 bankIncome: self.bankIncome
                ,animalIncome: animalIncome
                ,thingIncome: thingIncome

            }
            ,expenses: {
                 animalExpense: animalExpense
                ,householdExpense: householdExpense
            }
            ,goals:{
                collegeExpense: collegeExpense
            }
            ,info: {
                collegeCount: collegeKidCount
            }

        }

        $.extend(financialInfo, {
             totalAssets: financialInfo.assets.cash + financialInfo.assets.bankAmount + financialInfo.assets.piggyBankAmount + financialInfo.assets.animalValue + financialInfo.assets.thingValue
            ,totalIncome: financialInfo.incomes.bankIncome + financialInfo.incomes.animalIncome + financialInfo.incomes.thingIncome
            ,totalExpense: financialInfo.expenses.animalExpense + financialInfo.expenses.householdExpense
            ,totalGoal: financialInfo.goals.collegeExpense
        });

        return financialInfo;

    }

   ,createGameBoard: function() {
       var self = this;
       var gamePeriod = self.level == 1 ? 1 : getRandomInt(2,5);
       var gameBoard = {
             initialCash: self.level == 1 ?  constants.INITIAL_CASH : constants.INITIAL_CASH * getRandomInt(1,3)
            ,cash: 0
            ,bankInterestRate: getRandomInt(8,14)
            ,bankAmount: 0
            ,piggyBankAmount: 0
            ,period: gamePeriod
            ,children: []
            ,animals: []
            ,things: []
            ,dryWeather: []

       };

       gameBoard.cash = gameBoard.initialCash;
       var cows = 0;
       var goats = 0;
       var chickens = 0;

       switch(self.level) {

           case 1:
               cows = 1;
               chickens = 0;
               goats = 0;
               break;
           case 2:
               cows = 1;
               chickens = getRandomInt(1,2);
               goats = 0;
               break;
           case 3:
               cows = getRandomInt(1,3);
               chickens = getRandomInt(1,4);
               goats = 1;
               break;
           case 4:
               cows = getRandomInt(1,3);
               chickens = getRandomInt(1,5);
               goats = getRandomInt(1,3);
               break;

       }

       for(var c=0;c<cows;c++) {
           gameBoard.animals.push(self.createAnimal('cow', c, gamePeriod));
       }

       for(var g=0;g<goats;g++) {
           gameBoard.animals.push(self.createAnimal('goat', g, gamePeriod));
       }

       for(var k=0;k<chickens;k++) {
           gameBoard.animals.push(self.createAnimal('chicken', k, gamePeriod));
       }

       var kids = getRandomInt(1,4);

       for(var s=0;s<kids;s++) {
           gameBoard.children.push({
                college: getRandomInt(1,1000) < 500 ? true : false
               ,gender: getRandomInt(1,1000) < 500 ? 'f' : 'm'
           });
       }

       for(var p=0;p<gamePeriod;p++)
       {
           gameBoard.dryWeather.push(getRandomInt(1,1000) < 500);
       }

        var tractors =  self.level == 1 ? 0 : 1;
       var landPlots = self.level == 1 ? 1 : getRandomInt(1,3);


        if (tractors > 0) {
            for(var t=0;t<tractors;t++) {
                gameBoard.things.push(self.createThing('tractor', t, gamePeriod));
            }
        }
       for(var l=0;l<landPlots;l++) {
           gameBoard.things.push(self.createThing('land', l, gamePeriod));
       }

       return gameBoard;

    }

   ,sellAnimal: function(index, year) {
        var self = this;
        if ((index > self.animals.length-1) || (year > self.period-1)) return;
        for(var p=year;p<self.period;p++)
        {
            self.animals[index].sold[p] = true;

        }
    }
    ,unsellAnimal: function(index, year) {
        var self = this;
        if ((index > self.animals.length-1) || (year> self.period-1)) return;
        for(var p=year;p>=0;p--)
        {
            self.animals[index].sold[p] = false;

        }
    }

    ,sellThing: function(index, year) {
        var self = this;

        if ((index > self.things.length-1) || (year > self.period-1)) return;
        for(var p=year;p<self.period;p++)
        {
            self.things[index].status[p] = 'sold';

        }
    }
    ,resetThing: function(index, year) {
        var self = this;
        if ((index > self.things.length-1) || (year> self.period-1)) return;
        for(var p=year;p>=0;p--)
        {
            if (self.things[index].status[year] == 'sold') {
            self.things[index].status[p] = 'using';
            }

        }
    }
    ,rentThing: function(index, year) {

        var self = this;
        if ((index > self.things.length-1) || (year > self.period-1)) return;
        if (self.things[index].status[year] != 'sold') {
            self.things[index].status[year] = 'rented';
        }
    }

    ,createThing: function(thing, index, period) {
        var statusInfo = [];
        for(var p=0;p<period;p++)
        {
            statusInfo.push('using');
        }
        switch(thing.toLowerCase()) {

            case "land":
                return {
                     name: 'Land Plot ' + (index + 1)
                    ,id: 'land'
                    ,sellingPrice: constants.LAND_SELLING_PRICE
                    ,annualRentIncome: constants.LAND_ANNUAL_RENT_INCOME
                    ,annualAgricultureIncome: constants.LAND_ANNUAL_AGRICULTURE_INCOME
                    ,status: statusInfo
                }
            case "tractor":
                return {
                    name: 'Tractor ' + (index + 1)
                    ,id: 'tractor'
                    ,sellingPrice: constants.TRACTOR_SELLING_PRICE
                    ,annualRentIncome: constants.TRACTOR_ANNUAL_RENT_INCOME
                    ,annualAgricultureIncome: constants.TRACTOR_ANNUAL_AGRICULTURE_INCOME
                    ,status: statusInfo
                }
        }

    }
   ,depositToBank: function(amount) {
        var self = this;
        if ((amount > 0) && (amount <= self.cash))
        {
            self.bankAmount = amount;
            for(var d=0;d<self.period;d++)
            {
                self.bankAmount += (self.bankAmount * (self.bankInterestRate/100));
            }
            self.bankIncome = Math.round(self.bankAmount - amount);
            self.bankAmount = amount;
            self.cash -= amount;
        }
    }

   ,depositToPiggyBank: function(amount) {
        var self = this;
        if ((amount > 0) && (amount <= self.cash))
        {
            self.piggyBankAmount = amount;
            self.cash -= amount;
        }
    }
   ,createAnimal: function(animal, index, period) {

        var cowNames = ['Heera', 'Chameli', 'Meera', 'Rani', 'Meena', 'Teelu'];
        var chickenNames = ['Bakbak', 'Chintu', 'Urgi', 'Basanti', 'Mumtaz'];
        var goatNames = ['Aishwarya', 'Priyanka', 'Kajol', 'Deepika', 'Sonal'];
        var soldInfo = [];
        for(var p=0;p<period;p++)
        {
            soldInfo.push(false);
        }
        switch(animal.toLowerCase()) {

            case "chicken":
                return {
                     name: 'Chicken: ' + chickenNames[index]
                    ,id: 'chicken'
                    ,output: 'egg'
                    ,outputPlural: 'eggs'
                    ,sellingPrice: constants.CHICKEN_SELLING_PRICE
                    ,annualExpense: constants.CHICKEN_ANNUAL_EXPENSE
                    ,annualIncome: constants.CHICKEN_ANNUAL_INCOME
                    ,sold: soldInfo
                }

            case "goat":
                return {
                     name: 'Goat: ' + goatNames[index]
                    ,id: 'goat'
                    ,output: 'milk'
                    ,outputPlural: 'milk'
                    ,sellingPrice: constants.GOAT_SELLING_PRICE
                    ,annualExpense: constants.GOAT_ANNUAL_EXPENSE
                    ,annualIncome: constants.GOAT_ANNUAL_INCOME
                    ,sold: soldInfo
                }

            default:
                return {
                     name: 'Cow: ' + cowNames[index]
                    ,id: 'cow'
                    ,output: 'milk'
                    ,outputPlural: 'milk'
                    ,sellingPrice: constants.COW_SELLING_PRICE
                    ,annualExpense: constants.COW_ANNUAL_EXPENSE
                    ,annualIncome: constants.COW_ANNUAL_INCOME
                    ,sold: soldInfo
                }
        }


    }


};

function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatRupees(amount) {
    amount = amount.toString();
    var lastThree = amount.substring(amount.length-3);
    var otherNumbers = amount.substring(0,amount.length-3);
    if(otherNumbers != '')
        lastThree = ',' + lastThree;
    return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;

}