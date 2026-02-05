from fastapi import HTTPException
import sqlite3
from typing import Union
import datetime


def get_db_path():
    return "backend/database/lifting_log.db"


def get_db():
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    # conn.execute("PRAGMA busy_timeout = 5000;")
    # conn.execute("PRAGMA journal_mode = WAL;")
    try:
        yield conn
    finally:
        conn.close()


def create_date(year: int = 0, month: int = 0, day: int = 0):
    date: int = int( (year * 10000) + (month * 100) + day )
    return date


def get_date_today():
    today: datetime.date = datetime.date.today()
    date: int = int(today.strftime("%Y%m%d"))
    return date


def get_year(date: int):
    return int(date // 10000)


def get_month(date: int):
    return int((date // 100) % 100)


def get_day(date: int):
    return int(date % 100)


def get_YYYYMMDD(date: int):
    year: int = get_year(date)
    month: int = get_month(date)
    day: int = get_day(date)
    return year, month, day


def is_valid_timestamp(timestamp: Union[int, str], is_date: bool = False, is_time: bool = False):
    if is_date:
        if not isinstance(timestamp, int):
            return False
        if timestamp < 0:
            return False
        
        year, month, day = get_YYYYMMDD(timestamp)
        if year <= 1752 or year > 10000:
            return False
        if month <= 0 or month > 12:
            return False
        if day <= 0 or day > 31:
            return False
        
    if is_time:
        if not isinstance(timestamp, str):
            return False
        if len(timestamp) != 8:
            return False
        
        for i in range(0, 8, 3):
            if not (timestamp[i].isdigit() and timestamp[i+1].isdigit()):
                return False
            if i < 6 and timestamp[i+2] != ':':
                return False
    
    return True


def get_year_code(year: int):
    yy: int = year % 100
    year_code: int = (yy + (yy // 4)) % 7
    return year_code


def get_month_code(month: int):
    match month:
        case 1: return 0
        case 2: return 3
        case 3: return 3
        case 4: return 6
        case 5: return 1
        case 6: return 4
        case 7: return 6
        case 8: return 2
        case 9: return 5
        case 10: return 0
        case 11: return 3
        case 12: return 5

        case _:
            return -1
    return -1


def get_century_code(year: int):
    centuries_since_1700: int = (year - 1700) // 100
    mod: int = centuries_since_1700 % 4
    if mod == 0:
        return 4
    if mod == 1:
        return 2
    if mod == 2:
        return 0
    if mod == 3:
        return 6
    
    return -1


def get_leap_year_modifier(year: int, month: int):
    if month > 2:
        return 0
    if year % 4 == 0:
        if year % 100 != 0:
            return 1
        elif year % 400 == 0:
            return 1
     
    return 0


def get_day_of_the_week(date: int):
    if not is_valid_timestamp(date, is_date=True):
        return -1
    
    year, month, day = get_YYYYMMDD(date)

    if year <= 1752: # change from julian to gregorian calendar, method only works for gregorian calendar
        return -1
    
    year_code: int = get_year_code(year)
    month_code: int = get_month_code(month)
    century_code: int = get_century_code(year)
    date_number: int = day
    leap_year_modifier: int = get_leap_year_modifier(year, month)
    days_in_a_week: int = 7
    
    if year_code == -1 or month_code == -1 or century_code == -1 or date_number == -1 or leap_year_modifier == -1:
        return -1
    
    # 0-6, 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    day_of_week: int = (year_code + month_code + century_code + date_number - leap_year_modifier) % days_in_a_week
    return day_of_week