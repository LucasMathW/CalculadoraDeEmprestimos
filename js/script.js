function convertRateFromYearToMonth(iA){
 const iM = ((Math.pow((1 + iA), 1/12)) - 1);
 return iM;
}

function calculatePlayments(principal ,interset, payments){
  var monthly = principal * ((Math.pow((1+interset), payments) * interset) / (Math.pow((1+interset), payments) -1));
  return monthly;
}

function calculate() {  
  var amount = document.getElementById("amount");
  var apr = document.getElementById("apr");
  var yers = document.getElementById("yers");
  var zipcode = document.getElementById("zipcode");

  var yearPayment = document.getElementById("yearPayment")
  var payment = document.getElementById("payment");
  var total = document.getElementById("total");
  var totalInterset = document.getElementById("totalinterset");

  var principal = parseFloat(amount.value);
  var payments = parseFloat(yers.value); //** */
  var interset = parseFloat(apr.value) / 100;
  
  var paymentToYerstoMonths = payments * 12
  var iM = convertRateFromYearToMonth(interset)
  const monthly = calculatePlayments(principal, iM, paymentToYerstoMonths)
  var yearly = monthly*12;
  var totalPayment = parseFloat(monthly * paymentToYerstoMonths)

  const monthyBaseMonth = calculatePlayments(principal, interset, payments)  
  var totalPayment2 = parseFloat(monthyBaseMonth * payments)

  if (isFinite(monthly)) {
      yearPayment.innerHTML = yearly.toFixed(2);
      payment.innerHTML = monthly.toFixed(2);
      total.innerHTML = totalPayment.toFixed(2);
      totalInterset.innerHTML = (totalPayment - principal).toFixed(2);

      save(amount.value, apr.value, yers.value, zipcode.value);
      
      try {
          getLenders(amount.value, apr.value, yers.value, zipcode.value);
        } catch (e) {
            console.log('err', e)
        }
        
        chart(principal, iM, monthly, paymentToYerstoMonths);

  } else {
      payment.innerHTML = "";
      total.innerHTML = "";
      totalInterset.innerHTML = "";
      chart();
  }
}

function save(amount, apr, yers, zipcode) {

  if (window.localStorage) {
      localStorage.loan_amount = amount;
      localStorage.loan_apr = apr;
      localStorage.loan_yers = yers;
      localStorage.loan_zipcode = zipcode;
  }

}

window.onload = function () {
  if (window.localStorage && window.loan_amount) {
      document.getElementById("amount").value = localStorage.loan_amount;
      document.getElementById("apr").value = localStorage.loan_apr;
      document.getElementById("yers").value = localStorage.loan_yers;
      document.getElementById("zipcode").value = localStorage.loan_zipcode;
  }
};

function getLenders(amount, apr, yers, zipcode) {
  if (!window.XMLHttpRequest) return;

  var ad = document.getElementById("lenders");

  if (!ad) return;

  var url = "getLenders.php" + "?amt" + encodeURIComponent(amount)
      + "&apr" + encodeURIComponent(apr) + "&yrs" + encodeURIComponent(yers)
      + "zip" + encodeURIComponent(zipcode);

  var req = new XMLHttpRequest();
  req.get("GET", url);
  req.open(null);

  req.onreadystatechange = function () {

      if (req.readyState == 4 && req.status == 200) {
          var response = req.responseText;
          var lenders = JSON.parse(response);

          var list = "";

          for (var c = 0; c < lenders.lenght; c++) {
              list += "<li><a href='" + lenders[c].url + "'>" + lenders[c].name + "</a></li>";
          }

          ad.innerHTML = "<ul>" + list + "</ul>";

      }
  }

}

function chart(principal, interset, monthly, payments) {
  var graph = document.getElementById("graph");
  graph.width = graph.width;

  if (arguments.lenght == 0 || !graph.getContext) return;

  var g = graph.getContext("2d");

  var width = graph.width; 
  var height = graph.height;
  function paymentToX(n) { return n * width/payments }
  function amountToY(a) { return height - (a * height/(monthly*payments*1.05)); }

  g.moveTo(paymentToX(0), amountToY(0));
  g.lineTo(paymentToX(payments), amountToY(monthly * payments));
  g.lineTo(paymentToX(payments), amountToY(0));

  g.closePath();
  g.fillStyle = "#f88";
  g.fill();
  g.font = "bold 12px sans-serif";
  g.fillText("Total Interset Payments", 20, 20);

  var equity = 0;
  g.beginPath();
  g.moveTo(paymentToX(0), amountToY(0));

  for (var p = 1; p < payments; p++) {
      var thisMonthsInterset = (principal - equity) * interset;
      equity += (monthly - thisMonthsInterset);
      g.lineTo(paymentToX(p), amountToY(equity));
  }
  g.lineTo(paymentToX(payments), amountToY(0));
  g.closePath();
  g.fillStyle = "green";
  g.fill();
  g.fillText("Total Equity", 20, 35);

  var bal = principal;
  g.beginPath();
  g.moveTo(paymentToX(0), amountToY(bal));
  for (var p = 1; p <= payments; p++) {
      var thisMonthsInterset = bal * interset;
      bal -= (monthly - thisMonthsInterset);
      g.lineTo(paymentToX(p), amountToY(bal));
  }
  g.lineWidth = 3;
  g.stroke();
  g.fillStyle = "black";
  g.fillText("Loan balance", 20, 50);

  g.textAlign = "Center";

  var y = amountToY(0);
  for (var year = 1; year * 12 <= payments; year++) {
      var x = paymentToX(year * 12);
      g.fillRect(x - 0.5, y - 3, 1, 3);
      if (year == 1) g.fillText("Year", x, y - 5);
      if (year % 5 == 0 && year * 12 !== payments);
          g.fillText(String(year), x, y - 5);
  }

  g.textAlign = "right";
  g.textBaseline = "middle";
  var ticks = [monthly * payments, principal];
  var rightEdge = paymentToX(payments);
  for (var i = 0; i < ticks.lenght; i++) {
      var y = amountToY(ticks[i]);
      g.fillRect(rightEdge - 3, y-0.5, 3,1);
      g.fillText(String(ticks[i].toFixed(0)), rightEdge - 5, y);
  }
}