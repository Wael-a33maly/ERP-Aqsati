import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { governorates, cities } from 'egydata'

// جلب المحافظات المصرية المتاحة للاستيراد
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get('companyId')
    const action = searchParams.get('action') || 'list'

    if (action === 'list') {
      // قائمة المحافظات المتاحة للاستيراد
      const allGovernorates = governorates.getAll()
      
      // جلب المحافظات المستوردة بالفعل
      const importedGovs = companyId 
        ? await db.governorate.findMany({ 
            where: { companyId },
            select: { code: true }
          })
        : []
      
      const importedCodes = new Set(importedGovs.map(g => g.code))

      const availableGovernorates = allGovernorates.map(gov => ({
        id: gov.id,
        code: gov.code,
        name: gov.name,
        nameEn: gov.nameEn,
        citiesCount: cities.getByGovernorate(gov.code).length,
        imported: importedCodes.has(gov.code)
      }))

      return NextResponse.json({
        success: true,
        data: availableGovernorates
      })
    }

    if (action === 'imported' && companyId) {
      // جلب المحافظات المستوردة مع التفاصيل
      const importedGovs = await db.governorate.findMany({
        where: { companyId },
        include: {
          City: {
            include: {
              _count: { select: { Customer: true } },
              Area: { select: { id: true } }
            }
          },
          _count: { select: { Customer: true } }
        },
        orderBy: { name: 'asc' }
      })

      const data = importedGovs.map(gov => ({
        id: gov.id,
        code: gov.code,
        name: gov.name,
        nameAr: gov.nameAr,
        active: gov.active,
        citiesCount: gov.City.length,
        customersCount: gov._count.Customer,
        cities: gov.City.map(city => ({
          id: city.id,
          name: city.name,
          nameAr: city.nameAr,
          areasCount: city.Area.length,
          customersCount: city._count.Customer
        }))
      }))

      return NextResponse.json({ success: true, data })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' })
  } catch (error: any) {
    console.error('Error fetching Egypt locations:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// استيراد محافظة مع مدنها
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyId, governorateCodes } = body

    if (!companyId) {
      return NextResponse.json({ success: false, error: 'companyId is required' }, { status: 400 })
    }

    if (!governorateCodes || !Array.isArray(governorateCodes) || governorateCodes.length === 0) {
      return NextResponse.json({ success: false, error: 'governorateCodes array is required' }, { status: 400 })
    }

    // التحقق من وجود الشركة
    const company = await db.company.findUnique({ where: { id: companyId } })
    if (!company) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 })
    }

    let importedGovs = 0
    let importedCities = 0
    let importedAreas = 0
    let skippedGovs = 0

    for (const govCode of governorateCodes) {
      // التحقق من وجود المحافظة مسبقاً
      const existingGov = await db.governorate.findFirst({
        where: { companyId, code: govCode }
      })

      if (existingGov) {
        skippedGovs++
        continue
      }

      // جلب بيانات المحافظة
      const govData = governorates.getByCode(govCode)
      if (!govData) continue

      // إنشاء المحافظة
      const governorate = await db.governorate.create({
        data: {
          companyId,
          code: govCode,
          name: govData.nameEn,
          nameAr: govData.name,
          active: true
        }
      })

      importedGovs++

      // جلب مدن المحافظة
      const govCities = cities.getByGovernorate(govCode)

      // إنشاء المدن دفعة واحدة
      for (const cityData of govCities) {
        const city = await db.city.create({
          data: {
            companyId,
            governorateId: governorate.id,
            code: `${govCode}-${cityData.id}`,
            name: cityData.nameEn,
            nameAr: cityData.name,
            active: true
          }
        })
        importedCities++

        // إنشاء منطقة افتراضية لكل مدينة (المدينة نفسها كمنطقة)
        await db.area.create({
          data: {
            companyId,
            cityId: city.id,
            code: `${govCode}-${cityData.id}-01`,
            name: cityData.nameEn,
            nameAr: cityData.name,
            active: true
          }
        })
        importedAreas++
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        importedGovernorates: importedGovs,
        importedCities,
        importedAreas,
        skippedGovernorates: skippedGovs
      },
      message: `تم استيراد ${importedGovs} محافظة مع ${importedCities} مدينة و ${importedAreas} منطقة`
    })
  } catch (error: any) {
    console.error('Error importing Egypt locations:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// حذف محافظة مع كل بياناتها التابعة
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const governorateId = searchParams.get('governorateId')
    const companyId = searchParams.get('companyId')
    const resetAll = searchParams.get('resetAll')

    // حذف جميع البيانات
    if (resetAll === 'true' && companyId) {
      // حذف جميع المناطق
      await db.area.deleteMany({ where: { companyId } })
      // حذف جميع المدن
      await db.city.deleteMany({ where: { companyId } })
      // حذف جميع المحافظات
      await db.governorate.deleteMany({ where: { companyId } })

      return NextResponse.json({ 
        success: true, 
        message: 'تم حذف جميع بيانات المواقع بنجاح' 
      })
    }

    if (!governorateId || !companyId) {
      return NextResponse.json({ 
        success: false, 
        error: 'governorateId and companyId are required' 
      }, { status: 400 })
    }

    // التحقق من وجود المحافظة
    const governorate = await db.governorate.findFirst({
      where: { id: governorateId, companyId },
      include: {
        City: {
          include: {
            _count: { select: { Customer: true } }
          }
        },
        _count: { select: { Customer: true } }
      }
    })

    if (!governorate) {
      return NextResponse.json({ success: false, error: 'Governorate not found' }, { status: 404 })
    }

    // التحقق من وجود عملاء مرتبطين
    const totalCustomers = governorate._count.Customer + 
      governorate.City.reduce((sum, city) => sum + city._count.Customer, 0)

    if (totalCustomers > 0) {
      return NextResponse.json({ 
        success: false, 
        error: `لا يمكن حذف المحافظة لوجود ${totalCustomers} عميل مرتبط بها` 
      }, { status: 400 })
    }

    // حذف المحافظة (سيتم حذف المدن والمناطق تلقائياً بسبب onDelete: Cascade)
    await db.governorate.delete({ where: { id: governorateId } })

    return NextResponse.json({ 
      success: true, 
      message: `تم حذف المحافظة "${governorate.nameAr || governorate.name}" مع جميع بياناتها` 
    })
  } catch (error: any) {
    console.error('Error deleting governorate:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
