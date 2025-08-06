import {vec2,vec3,mat3,quat} from "glMatrix"

export function point_to_point_distance(p1,p2)
{
    return vec3.distance(p1,p2);
}

export function barycentric_point(p,c)
{
    return 1;
}

export function scalar_project_onto_line(p,l1,l2)
{
    let a = vec3.create();
    vec3.subtract(a,p,l1);
    let b = vec3.create();
    vec3.subtract(b,l2,l1);
    vec3.normalize(b,b);
    let scalar_proj = vec3.dot(a,b);
    return scalar_proj;
}

export function project_onto_line(p,l1,l2)
{
    let b = vec3.create();
    vec3.subtract(b,l2,l1);
    vec3.normalize(b,b);
    let scalar_proj = scalar_project_onto_line(p,l1,l2);
    let proj = vec3.create();
    vec3.scale(proj,b,scalar_proj);
    vec3.add(proj,proj,l1);
    return proj;
}

export function barycentric_line(p,l1,l2)
{
    let scalar = scalar_project_onto_line(p,l1,l2);
    let dist = point_to_point_distance(l1,l2);
    let b1 = scalar / dist;
    let b0 = 1 - b1;
    return [b0,b1];
}

export function barycentric_line_bounded(p,l1,l2)
{
    let bary = barycentric_line(p,l1,l2);
    function clamp(min,val,max)
    {
        return Math.max(min,Math.min(val,max));
    }
    return [clamp(0,bary[0],1),clamp(0,bary[1],1)];
}

export function project_onto_line_segment(p,l1,l2)
{
    let bary = barycentric_line_bounded(p,l1,l2)[0];
    if(bary >= 1) return l1;
    if(bary <= 0) return l2;
    return project_onto_line(p,l1,l2);
}

export function calculate_1_setpoint(old_sp,current_bary,target_bary)
{
    if(old_sp[0] <= 0) return target_bary;
    if(old_sp[1] <= 0) return [old_sp[0],target_bary[1]];
    if(target_bary[0] <= 0) return [0,target_bary[1]];
    if(target_bary[0] >= 1) return [old_sp[0],0];
    if(target_bary[1] <= 0) return [old_sp[0],0];
    if(target_bary[1] >= 1) return [0,target_bary[1]];
    if(current_bary[0] <= 0) return [old_sp[0],target_bary[1]];
    if(current_bary[0] >= 1) return [old_sp[0],target_bary[1]];
    if(current_bary[1] <= 0) return [old_sp[0],target_bary[1]];
    if(current_bary[1] >= 1) return [old_sp[0],target_bary[1]];
    let old_sp_ratio = old_sp[0]/old_sp[1];
    let target_bary_ratio = target_bary[0]/target_bary[1];
    let current_bary_ratio = current_bary[0]/current_bary[1];
    let mult = old_sp_ratio / current_bary_ratio;
    let new_sp_ratio = mult * target_bary_ratio;
    let new_sp = [old_sp[0],old_sp[0]/new_sp_ratio];
    return new_sp;
}

export function point_to_line_distance(p,l1,l2)
{
    let projection = project_onto_line_segment(p,l1,l2);
    return point_to_point_distance(p,projection);
}

export function get_rotation_from_triangle_to_xy(t1,t2,t3)
{
    let t2_origin = vec3.create();
    let t3_origin = vec3.create();
    vec3.sub(t2_origin,t2,t1);
    vec3.sub(t3_origin,t3,t1);
    let triangle_normal = vec3.create();
    vec3.cross(triangle_normal,t2_origin,t3_origin);
    let target_axis = vec3.fromValues(0,0,1);
    let rotation_axis = vec3.create();
    vec3.cross(rotation_axis,triangle_normal,target_axis);
    vec3.normalize(rotation_axis,rotation_axis);
    let rotation_magnitude = vec3.angle(triangle_normal,target_axis);
    let rotation = quat.create();
    quat.setAxisAngle(rotation,rotation_axis,rotation_magnitude);
    return rotation;
}

export function project_onto_plane(p,t1,t2,t3)
{
    let rotation = get_rotation_from_triangle_to_xy(t1,t2,t3);
    let projection = vec3.create();
    vec3.transformQuat(projection,p,rotation);
    projection[2] = 0;
    quat.invert(rotation,rotation);
    vec3.transformQuat(projection,projection,rotation);
    return projection;
}

export function barycentric_triangle(p,t1,t2,t3)
{
    let rotation = get_rotation_from_triangle_to_xy(t1,t2,t3);
    function project_xy(p)
    {
        let projection = vec3.create();
        vec3.transformQuat(projection,p,rotation);
        projection = vec2.fromValues(projection[0],projection[1]);
        return projection;
    }
    let p_2d = project_xy(p);
    let t1_2d = project_xy(t1);
    let t2_2d = project_xy(t2);
    let t3_2d = project_xy(t3);
    let lin_eq_left = mat3.fromValues(t1_2d[0],t1_2d[1],1,t2_2d[0],t2_2d[1],1,t3_2d[0],t3_2d[1],1);
    let lin_eq_right = vec3.fromValues(p_2d[0],p_2d[1],1);
    let inv_left = mat3.create();
    mat3.invert(inv_left,lin_eq_left);
    let solution = vec3.create();
    vec3.transformMat3(solution,lin_eq_right,inv_left);
    return solution;
}

export function barycentric_triangle_bounded(p,t1,t2,t3)
{
    let bary = barycentric_triangle(p,t1,t2,t3);
    let sw = 0;
    if(bary[0] <= 0) sw += 1;
    if(bary[1] <= 0) sw += 2;
    if(bary[2] <= 0) sw += 4;
    switch(sw)
    {
        case 0:
            return bary;
            break;
        case 1:
            bary = barycentric_line_bounded(p,t2,t3);
            return [0,bary[0],bary[1]];
            break;
        case 2:
            bary = barycentric_line_bounded(p,t1,t3);
            return [bary[0],0,bary[1]];
            break;
        case 3:
            return [0,0,1];
            break;
        case 4:
            bary = barycentric_line_bounded(p,t1,t2);
            return [bary[0],bary[1],0];
            break;
        case 5:
            return [0,1,0];
            break;
        case 6:
            return [1,0,0];
            break;
    }
}

export function project_onto_triangle(p,t1,t2,t3)
{
    let bary = barycentric_triangle(p,t1,t2,t3);
    let sw = 0;
    if(bary[0] <= 0) sw += 1;
    if(bary[1] <= 0) sw += 2;
    if(bary[2] <= 0) sw += 4;
    switch(sw)
    {
        case 0:
            return project_onto_plane(p,t1,t2,t3);
            break;
        case 1:
            return project_onto_line_segment(p,t2,t3);
            break;
        case 2:
            return project_onto_line_segment(p,t1,t3);
            break;
        case 3:
            return t3;
            break;
        case 4:
            return project_onto_line_segment(p,t1,t2);
            break;
        case 5:
            return t2;
            break;
        case 6:
            return t1;
            break;
    }
}

export function point_to_triangle_distance(p,t1,t2,t3)
{
    let projection = project_onto_triangle(p,t1,t2,t3);
    return point_to_point_distance(p,projection);
}

export function angle_between_lines(a1,a2,b1,b2)
{
    let a = vec3.create();
    vec3.subtract(a,a2,a1);
    let b = vec3.create();
    vec3.subtract(b,b2,b1);
    let t = vec3.angle(a,b);
    return t;
}

export function angle_between_lines_q1(a1,a2,b1,b2)
{
    let t = angle_between_lines(a1,a2,b1,b2);
    if(t>(Math.PI/2))
        t = Math.PI - t;
    return t;
}

export function rad_to_deg(t)
{
    return t * (180/Math.PI);
}