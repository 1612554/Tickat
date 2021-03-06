var dateFormat = require('dateformat');
var moment = require('moment');
var numeral = require('numeral');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

var eventService = require('../../service/eventService');
var categoryService = require('../../service/categoryService');
var organizationService = require('../../service/organizationService');
var userService = require('../../service/userService');
var ticketService = require('../../service/ticketService');
var orderService = require('../../service/orderService');

var Event = require('../../models/event');
var Order_detail = require('../../models/order_detail');
var Ticket = require('../../models/ticket');
var TypeTicket = require('../../models/type_of_ticket');

var handleData = require('../../utils/handleData');

var sales = [0,0,0,0,0,0,0,0,0,0,0,0];
var totalTicketInYear=0;
var totalTicketInYearBought=0;
var saleInYear=0;

var totalTicketinMonth=[0,0,0,0,0,0,0,0,0,0,0,0];
var saleInMonth =0;
var percentSaleInMonth=0;

var seatInMonth=0;

var now = new Date();
var monthNow = now.getMonth();
var month = ["January","February","March","April","May","June","July","August","September","October","November","December"];

var percentTotalPrice;

var daySale;
var dayArr=[];


function CalculateTotalAndSaleInYear(tickets){
    for(i=0;i<tickets.length;i++)
     {
        saleInYear = saleInYear + parseInt(tickets[i].price) *  parseInt(tickets[i].bought);
        console.log(saleInYear,tickets[i].price,tickets[i].bought);
        totalTicketInYear = totalTicketInYear +  parseInt(tickets[i].amount);
        totalTicketInYearBought = totalTicketInYearBought +  parseInt(tickets[i].bought);
     }  
    percentTotalPrice = ((totalTicketInYearBought/totalTicketInYear)*100).toFixed(2);
}

function getSaleInMonthOfYear(orders){
    
    orders.forEach(function getOrderByMonth(order){
        day=new Date(order.date_bought);
        m = day.getMonth();
 
        for(j=0;j<order.order_details.length;j++){ 
           sales[m] = sales[m] + parseInt(order.order_details[j].amount) * parseInt(order.order_details[j].ticket.price);
            totalTicketinMonth[m] = totalTicketinMonth[m] + parseInt(order.order_details[j].amount);
        }
    });
    return sales;
}

function getSaleAndSeatInMonth(){
    saleInMonth = sales[monthNow];
    percentSaleInMonth = (totalTicketinMonth[monthNow]/totalTicketInYear*100).toFixed(2);

    seatInMonth = totalTicketinMonth[monthNow];
}

function getDayArr(daystart,dayto){
    var arr = new Array();

    if(daystart==0){
        for(i=9;i>=0;i--){
            var daybefore = dateFormat(moment().subtract(i, 'days'),"yyyy-mmmm-dd");
            arr.push(daybefore);
        }
    }
    else{
        dt = new Date(daystart);
        dayend = new Date(dayto);
        while (dt <= dayend) {
            console.log('dt',dt);
        arr.push(dateFormat(new Date(dt),"yyyy-mmmm-dd"));
        dt.setDate(dt.getDate() + 1);
      }
      console.log('dayss',arr);
    
    }

    return arr;

}

function getSaleInDay(orders){
    daySale = new Array();
    for(i=0;i<dayArr.length;i++)
        daySale[i]=0;

    orders.forEach(function getOrderByDay(order){
      
        for(j=0;j<order.order_details.length;j++){ 
            for(k=0;k<10;k++)
            {
                if(dateFormat(order.date_bought,"yyyy-mmmm-dd")==dayArr[k]){
                    daySale[k] = daySale[k]+ parseInt(order.order_details[j].amount) * parseInt(order.order_details[j].ticket.price);
                }
            }
        
        }
    
    });
    return daySale;
}

function resetAllData(){
    sales = [0,0,0,0,0,0,0,0,0,0,0,0];
    totalTicketInYear=0;
    totalTicketInYearBought=0;
    saleInYear=0;

    totalTicketinMonth=[0,0,0,0,0,0,0,0,0,0,0,0];
    saleInMonth =0;
    percentSaleInMonth=0;

    seatInMonth=0;

    now = new Date();
    monthNow = now.getMonth();

    percentTotalPrice;

    daySale =[0,0,0,0,0,0,0,0,0,0,0,0];
}

exports.dashboard = async (req, res)=>{
    var user_id = req.user.id;
   
    var organizations = await organizationService.getOrganizationIdByUserId(user_id);

    var events =[];
    for(i=0;i<organizations.length;i++){
        tmp = await eventService.getEventByOrganizationId(organizations[i].id);
        if(tmp.length!=0)
            for(j=0;j<tmp.length;j++)
                events.push(tmp[j]);
    }
    
    var tickets = [];
    var orders= [];
    for(i=0;i<events.length;i++){
       var ticket = await ticketService.getTicketsByEventId(events[i].id);
       if(ticket.length!=0)
        for(j=0;j<ticket.length;j++)
            tickets.push(ticket[j]);

      
       var order = await orderService.getOrdersByEventId(events[i].id);
       if(order.length!=0)
            for(j=0;j<order.length;j++)           
                orders.push(order[j]);

    }

    resetAllData();
    CalculateTotalAndSaleInYear(tickets); 
    var saleInMonthArr = await getSaleInMonthOfYear(orders);

    getSaleAndSeatInMonth();

    dayArr = new Array();
    dayArr = getDayArr(0,0);
    daySale = await getSaleInDay(orders);

    saleInYear = numeral(saleInYear).format('$0,0');
    saleInMonth = numeral(saleInMonth).format('$0,0');

    try{
        var data = {
            title: 'Dashboard',
            layout :'admin',
            user : req.user,
           
            month: month[monthNow],
            saleInYear: saleInYear,
            percentTotalPrice: percentTotalPrice,

            saleInMonth: saleInMonth,
            percentSaleInMonth: percentSaleInMonth,

            seatInMonth: seatInMonth,
            saleInMonthArr: saleInMonthArr,

            dayArr: dayArr,
            daySale: daySale,
        
        }; 
    
        res.render('admin/dashboard',data);
    } catch (e) {
       console.log(e);
    }
};

exports.dashboardchart = async (req, res)=>{
    var user_id = req.user.id;
   
    var organizations = await organizationService.getOrganizationIdByUserId(user_id);

    var events =[];
    for(i=0;i<organizations.length;i++){
        tmp = await eventService.getEventByOrganizationId(organizations[i].id);
        if(tmp.length!=0)
            for(j=0;j<tmp.length;j++)
                events.push(tmp[j]);
    }
    
    var tickets = [];
    var orders= [];
    for(i=0;i<events.length;i++){
       var ticket = await ticketService.getTicketsByEventId(events[i].id);
       if(ticket.length!=0)
        for(j=0;j<ticket.length;j++)
            tickets.push(ticket[j]);

      
       var order = await orderService.getOrdersByEventId(events[i].id);
       if(order.length!=0)
            for(j=0;j<order.length;j++)           
                orders.push(order[j]);

    }

    resetAllData();
     await CalculateTotalAndSaleInYear(tickets); 
     var saleInMonthArr = await getSaleInMonthOfYear(orders);

     await getSaleAndSeatInMonth();

     dayArr = new Array();
     dayArr = getDayArr(0,0);
     daySale = await getSaleInDay(orders);

    saleInYear = numeral(saleInYear).format('$0,0');
    saleInMonth = numeral(saleInMonth).format('$0,0');

    try{
        var data = {
            title: 'Dashboard chart',
            layout :'admin',
            user : req.user,
           
            month: month[monthNow],
            saleInYear: saleInYear,
            percentTotalPrice: percentTotalPrice,

            saleInMonth: saleInMonth,
            percentSaleInMonth: percentSaleInMonth,

            seatInMonth: seatInMonth,
            saleInMonthArr: saleInMonthArr,

            dayArr: dayArr,
            daySale: daySale,
        
        }; 
    
        res.render('admin/dashboard-chart',data);
    } catch (e) {
       console.log(e);
    }
};

exports.costChart = async (req,res)=>{

    var user_id = req.user.id;
   
    var organizations = await organizationService.getOrganizationIdByUserId(user_id);

    var events =[];
    for(i=0;i<organizations.length;i++){
        tmp = await eventService.getEventByOrganizationId(organizations[i].id);
        if(tmp.length!=0)
            for(j=0;j<tmp.length;j++)
                events.push(tmp[j]);
    }
    
    var tickets = [];
    var orders= [];
    for(i=0;i<events.length;i++){
       var ticket = await ticketService.getTicketsByEventId(events[i].id);
       if(ticket.length!=0)
        for(j=0;j<ticket.length;j++)
            tickets.push(ticket[j]);

      
       var order = await orderService.getOrdersByEventId(events[i].id);
       if(order.length!=0)
            for(j=0;j<order.length;j++)           
                orders.push(order[j]);

    }

    resetAllData();

    var daystart = req.query.daystart;
    var dayto = req.query.dayto;

    dayArr = new Array();
    dayArr = getDayArr(daystart,dayto);

    daySale = await getSaleInDay(orders);
    
    res.send({
        dayArr:dayArr,
        daySale:daySale,        
    });
    
};

exports.saleChart = async (req,res)=>{
    var yearnow = req.query.yearnow;

    var user_id = req.user.id;

    var organizations = await organizationService.getOrganizationIdByUserId(user_id);

    var events =[];
    for(i=0;i<organizations.length;i++){
        tmp = await eventService.getEventByOrganizationIdAndYear(organizations[i].id,yearnow);
        if(tmp.length!=0)
            for(j=0;j<tmp.length;j++)
                events.push(tmp[j]);
    }
    
    var tickets = [];
    var orders= [];
    for(i=0;i<events.length;i++){
       var ticket = await ticketService.getTicketsByEventId(events[i].id);
       if(ticket.length!=0)
        for(j=0;j<ticket.length;j++)
            tickets.push(ticket[j]);

      
       var order = await orderService.getOrdersByEventId(events[i].id);
       if(order.length!=0)
            for(j=0;j<order.length;j++)           
                orders.push(order[j]);

    }

    resetAllData();
     var saleInMonthArr = await getSaleInMonthOfYear(orders);

    res.send({
        saleInMonthArr: saleInMonthArr,
    });
    
};
